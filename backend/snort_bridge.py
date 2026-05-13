"""
Resilient Snort alert bridge.

Reads Snort3 alert_json.txt, tolerates file rotation/truncation, creates a
small event-capture record, and POSTs each alert to /alerts/ingest.
"""
import asyncio
import base64
import hashlib
import json
import os
import re
import shlex
import shutil
import struct
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote_plus
from typing import Optional

import httpx


SNORT_LOG = Path(os.environ.get("SNORT_ALERT_LOG", "/var/log/snort/alert_json.txt"))
NGINX_ACCESS_LOG = Path(os.environ.get("NGINX_ACCESS_LOG", "/var/log/nginx/access.log"))
CAPTURE_DIR = Path(os.environ.get("SNORT_CAPTURE_DIR", "/var/log/snort/event_captures"))
ROLLING_CAPTURE_DIR = Path(os.environ.get("SNORT_ROLLING_CAPTURE_DIR", "/var/log/snort/event_captures/ring"))
CUSTOM_SIGNATURES_FILE = Path(os.environ.get("CUSTOM_WEB_SIGNATURES_PATH", "/var/log/snort/custom_web_signatures.json"))
SENSOR_KEY_FILE = Path(os.environ.get("SENSOR_KEY_FILE", "/var/log/snort/sensor_key"))
BACKEND = os.environ.get("BACKEND_URL", "http://ids_backend:8000")
API_KEY = os.environ.get("SNORT_API_KEY") or os.environ.get("API_KEY", "")
POLL_INTERVAL = float(os.environ.get("SNORT_BRIDGE_POLL_INTERVAL", "0.25"))
REOPEN_INTERVAL = float(os.environ.get("SNORT_BRIDGE_REOPEN_INTERVAL", "2"))
SENSOR_IP = os.environ.get("IDS_SENSOR_IP", "172.18.0.7")
MAX_RECENT_EVENTS = int(os.environ.get("SNORT_BRIDGE_RECENT_EVENTS", "4096"))
ENABLE_NGINX_SIGNATURE_FALLBACK = os.environ.get("ENABLE_NGINX_SIGNATURE_FALLBACK", "true").lower() in {"1", "true", "yes"}
ENABLE_EVENT_PCAP = os.environ.get("ENABLE_EVENT_PCAP", "true").lower() in {"1", "true", "yes"}
PCAP_INTERFACE = os.environ.get("PCAP_INTERFACE", os.environ.get("INTERFACE", "eth0"))
PCAP_WINDOW_SECONDS = int(os.environ.get("EVENT_PCAP_WINDOW_SECONDS", "5"))
ROLLING_PCAP_SECONDS = int(os.environ.get("ROLLING_PCAP_SECONDS", "5"))
ROLLING_PCAP_FILES = int(os.environ.get("ROLLING_PCAP_FILES", "12"))
ROLLING_PCAP_FILTER = os.environ.get("ROLLING_PCAP_FILTER", "tcp port 80 or tcp port 443")

PRIORITY_MAP = {1: "critical", 2: "high", 3: "medium", 4: "low"}
ACCESS_RE = re.compile(r'^(?P<src>\S+) \S+ \S+ \[[^\]]+\] "(?P<method>[A-Z]+) (?P<target>\S+) HTTP/[^"]+" (?P<status>\d+)')
WEB_SIGNATURES = [
    ("Critical: Shadow File Access", "Path Traversal", "critical", ["/etc/shadow"]),
    ("High: Password File Disclosure Attempt", "Path Traversal", "high", ["/etc/passwd", "passwd.txt", "/wwwboard/passwd"]),
    ("High: Windows CGI Command Probe", "Exploit Attempt", "high", ["cmd.exe", "/winnt/system32/", "%5c../winnt/"]),
    ("High: Directory Traversal Probe", "Path Traversal", "high", ["../", "..%2f", "%2e%2e", "..%5c", "%5c../"]),
    ("High: Acunetix Scanner Probe", "Port Scan", "high", ["/acunetix-wvs-test-for-some-inexistent-file"]),
    ("Critical: SQL Union Select Injection", "SQL Injection", "critical", ["union select", "union+select", "union%20select"]),
    ("High: SQL Boolean Injection Probe", "SQL Injection", "high", ["or 1=1", "or+1=1", "or%201=1", "' or '1'='1"]),
    ("High: Script Tag XSS Attempt", "XSS", "high", ["<script", "%3cscript"]),
    ("High: Event Handler XSS Attempt", "XSS", "high", ["onerror=", "onload=", "javascript:alert"]),
    ("High: Environment File Disclosure", "Path Traversal", "high", ["/.env", ".env"]),
    ("High: Git Config Disclosure", "Path Traversal", "high", ["/.git/config", ".git%2fconfig"]),
    ("High: Proc Environ Disclosure", "Path Traversal", "high", ["/proc/self/environ"]),
    ("High: WordPress Config Disclosure", "Path Traversal", "high", ["wp-config.php"]),
    ("Critical: WordPress Admin Registration Abuse", "Exploit Attempt", "critical", ["/wp-admin/admin-ajax.php", "administrator"]),
    ("Medium: phpMyAdmin Probe", "Port Scan", "medium", ["phpmyadmin"]),
    ("High: Exposed Backup Archive Probe", "Path Traversal", "high", [".sql", ".bak", ".zip", "backup"]),
    ("Critical: Web Shell Upload Probe", "Exploit Attempt", "critical", ["shell.php", "cmd=", "eval("]),
    ("Critical: Log4Shell JNDI Lookup", "Exploit Attempt", "critical", ["${jndi:", "%24%7bjndi"]),
    ("Critical: CVE-2026-24880 Apache Tomcat request smuggling demo marker", "Exploit Attempt", "critical", ["/cve-2026-24880", "chunked=true"]),
    ("High: CVE-2026-29046 TinyWeb encoded header injection demo marker", "Exploit Attempt", "high", ["/cve-2026-29046", "%0d%0a"]),
]
CUSTOM_SIGNATURES_MTIME = 0.0
CUSTOM_SIGNATURES: list[dict] = []
HTTP_METHODS = (
    b"GET ",
    b"POST ",
    b"PUT ",
    b"PATCH ",
    b"DELETE ",
    b"HEAD ",
    b"OPTIONS ",
    b"TRACE ",
    b"CONNECT ",
)
MAX_RAW_REQUEST_BYTES = int(os.environ.get("MAX_RAW_REQUEST_BYTES", "8192"))


def current_api_key() -> str:
    if SENSOR_KEY_FILE.exists():
        key = SENSOR_KEY_FILE.read_text(encoding="utf-8").strip()
        if key:
            return key
    return API_KEY


def classify(msg: str) -> str:
    m = msg.lower()
    if any(k in m for k in ["sql", "union select", "xp_cmd"]):
        return "SQL Injection"
    if any(k in m for k in ["xss", "script", "cross-site"]):
        return "XSS"
    if any(k in m for k in ["scan", "nmap", "nikto", "probe"]):
        return "Port Scan"
    if any(k in m for k in ["traversal", "passwd", "shadow", "../"]):
        return "Path Traversal"
    if any(k in m for k in ["shellcode", "exploit", "overflow", "injection", "smuggling", "cve-"]):
        return "Exploit Attempt"
    if any(k in m for k in ["malware", "backdoor", "cnc"]):
        return "Malware"
    if any(k in m for k in ["brute", "login fail"]):
        return "Brute Force"
    if any(k in m for k in ["icmp", "ping"]):
        return "ICMP Probe"
    return "Intrusion Attempt"


def severity_from_alert(msg: str, priority: int | str | None) -> str:
    prefix = msg.strip().split(":", 1)[0].lower()
    if prefix in {"critical", "high", "medium", "low"}:
        return prefix
    return PRIORITY_MAP.get(int(priority) if priority else 3, "medium")


def split_ap(ap: str):
    if not ap:
        return "0.0.0.0", None
    if ":" in ap:
        parts = ap.rsplit(":", 1)
        return parts[0], int(parts[1]) if parts[1].isdigit() else None
    return ap, None


def packet_filter(src_ip: str, src_port: Optional[int], dst_ip: str, dst_port: Optional[int], proto: str) -> str:
    parts = [proto.lower(), "and", f"host {src_ip}", "and", f"host {dst_ip}"]
    ports = [p for p in [src_port, dst_port] if p]
    if ports:
        parts.extend(["and", "(" + " or ".join(f"port {p}" for p in ports) + ")"])
    return " ".join(parts)


def _decode_snort_b64(value: str) -> bytes:
    if not value:
        return b""
    compact = "".join(str(value).split())
    padding = "=" * (-len(compact) % 4)
    try:
        return base64.b64decode(compact + padding, validate=False)
    except Exception:
        return b""


def extract_http_request_from_bytes(data: bytes) -> Optional[str]:
    """Best-effort HTTP request extraction from Snort payload bytes or PCAP packets."""
    if not data:
        return None

    starts = [idx for method in HTTP_METHODS if (idx := data.find(method)) >= 0]
    if not starts:
        return None

    start = min(starts)
    end = data.find(b"\r\n\r\n", start)
    terminator_len = 4
    if end < 0:
        end = data.find(b"\n\n", start)
        terminator_len = 2
    if end < 0:
        end = min(len(data), start + MAX_RAW_REQUEST_BYTES)
        terminator_len = 0

    request_bytes = data[start : min(end + terminator_len, start + MAX_RAW_REQUEST_BYTES)]
    text = request_bytes.decode("utf-8", errors="replace")
    text = "".join(ch if ch in "\r\n\t" or ord(ch) >= 32 else "." for ch in text)
    text = text.replace("\r\n", "\n").strip()
    return text or None


def extract_raw_request_from_alert(raw: dict) -> Optional[str]:
    for key in ("request", "raw_request", "http_request"):
        value = raw.get(key)
        if value:
            return str(value).strip()

    decoded = _decode_snort_b64(str(raw.get("b64_data") or ""))
    return extract_http_request_from_bytes(decoded)


def extract_raw_request_from_pcap(path: Path) -> Optional[str]:
    if not path.exists() or path.stat().st_size <= 24:
        return None

    data = path.read_bytes()
    if len(data) < 24:
        return None

    magic = data[:4]
    if magic in {b"\xd4\xc3\xb2\xa1", b"\x4d\x3c\xb2\xa1"}:
        endian = "<"
    elif magic in {b"\xa1\xb2\xc3\xd4", b"\xa1\xb2\x3c\x4d"}:
        endian = ">"
    else:
        return extract_http_request_from_bytes(data)

    offset = 24
    while offset + 16 <= len(data):
        try:
            _, _, included_len, _ = struct.unpack(endian + "IIII", data[offset : offset + 16])
        except struct.error:
            return None
        offset += 16
        if included_len <= 0 or offset + included_len > len(data):
            return None

        request = extract_http_request_from_bytes(data[offset : offset + included_len])
        if request:
            return request
        offset += included_len

    return None


def write_capture_metadata(raw: dict, payload: dict, event_id: str) -> dict:
    CAPTURE_DIR.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(CAPTURE_DIR, 0o777)
    except OSError:
        pass
    metadata_path = CAPTURE_DIR / f"{event_id}.json"
    pcap_path = CAPTURE_DIR / f"{event_id}.pcap"
    metadata = {
        "event_id": event_id,
        "capture_mode": "event_pcap_ring" if ENABLE_EVENT_PCAP else "event_metadata",
        "capture_window_seconds": ROLLING_PCAP_SECONDS if ENABLE_EVENT_PCAP else 0,
        "packet_filter": packet_filter(
            payload["source_ip"],
            payload["source_port"],
            payload["destination_ip"],
            payload["destination_port"],
            payload["protocol"],
        ),
        "pcap_path": str(pcap_path) if ENABLE_EVENT_PCAP else None,
        "pcap_directory": "/var/log/snort",
        "note": "Event-triggered tcpdump capture. It is intentionally short-lived to avoid stressing Snort or the host.",
        "raw_alert": raw,
    }
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "event_id": event_id,
        "capture_path": str(pcap_path if ENABLE_EVENT_PCAP else metadata_path),
        "capture_mode": metadata["capture_mode"],
        "packet_filter": metadata["packet_filter"],
        "capture_window_seconds": metadata["capture_window_seconds"],
    }


async def capture_event_pcap(event_id: str, bpf_filter: str) -> Optional[Path]:
    if not ENABLE_EVENT_PCAP:
        return None

    CAPTURE_DIR.mkdir(parents=True, exist_ok=True)
    pcap_path = CAPTURE_DIR / f"{event_id}.pcap"
    await asyncio.sleep(1)

    ring_files = sorted(
        (path for path in ROLLING_CAPTURE_DIR.glob("*.pcap") if path.stat().st_size > 24),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    if ring_files:
        try:
            shutil.copyfile(ring_files[0], pcap_path)
            print(f"[bridge] PCAP copied {ring_files[0]} -> {pcap_path}", flush=True)
            return pcap_path
        except Exception as exc:
            print(f"[bridge] Rolling PCAP copy failed: {exc}", flush=True)

    safe_filter = bpf_filter or "tcp"
    command = [
        "tcpdump",
        "-i",
        PCAP_INTERFACE,
        "-s",
        "0",
        "-U",
        "-w",
        str(pcap_path),
        safe_filter,
    ]
    try:
        proc = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            _, stderr = await asyncio.wait_for(proc.communicate(), timeout=PCAP_WINDOW_SECONDS)
        except asyncio.TimeoutError:
            proc.terminate()
            try:
                await asyncio.wait_for(proc.wait(), timeout=2)
            except asyncio.TimeoutError:
                proc.kill()
                await proc.wait()
            print(f"[bridge] PCAP captured {pcap_path} filter={shlex.quote(safe_filter)}", flush=True)
            return pcap_path

        if proc.returncode not in (0, None):
            message = (stderr or b"").decode("utf-8", errors="replace").strip()
            print(f"[bridge] PCAP capture exited early rc={proc.returncode}: {message}", flush=True)
    except FileNotFoundError:
        print("[bridge] tcpdump is not installed; event pcap capture skipped", flush=True)
    except Exception as exc:
        print(f"[bridge] PCAP capture failed: {exc}", flush=True)
    return None


async def rolling_pcap_capture() -> None:
    if not ENABLE_EVENT_PCAP:
        return

    ROLLING_CAPTURE_DIR.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(CAPTURE_DIR, 0o777)
        os.chmod(ROLLING_CAPTURE_DIR, 0o777)
    except OSError:
        pass
    output_pattern = str(ROLLING_CAPTURE_DIR / "ids-%s.pcap")
    command = [
        "tcpdump",
        "-i",
        PCAP_INTERFACE,
        "-s",
        "0",
        "-U",
        "-G",
        str(ROLLING_PCAP_SECONDS),
        "-W",
        str(ROLLING_PCAP_FILES),
        "-w",
        output_pattern,
        ROLLING_PCAP_FILTER,
    ]
    while True:
        try:
            print(f"[bridge] Starting rolling PCAP capture: {shlex.join(command)}", flush=True)
            proc = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.PIPE,
            )
            _, stderr = await proc.communicate()
            message = (stderr or b"").decode("utf-8", errors="replace").strip()
            print(f"[bridge] Rolling PCAP stopped rc={proc.returncode}: {message}", flush=True)
        except FileNotFoundError:
            print("[bridge] tcpdump is not installed; rolling event pcap disabled", flush=True)
            return
        except Exception as exc:
            print(f"[bridge] Rolling PCAP failed: {exc}", flush=True)
        await asyncio.sleep(REOPEN_INTERVAL)


def load_custom_signatures() -> list[dict]:
    global CUSTOM_SIGNATURES_MTIME, CUSTOM_SIGNATURES

    if not CUSTOM_SIGNATURES_FILE.exists():
        CUSTOM_SIGNATURES_MTIME = 0.0
        CUSTOM_SIGNATURES = []
        return CUSTOM_SIGNATURES

    mtime = CUSTOM_SIGNATURES_FILE.stat().st_mtime
    if mtime == CUSTOM_SIGNATURES_MTIME:
        return CUSTOM_SIGNATURES

    try:
        loaded = json.loads(CUSTOM_SIGNATURES_FILE.read_text(encoding="utf-8"))
        if not isinstance(loaded, list):
            raise ValueError("custom signature file must contain a list")
        CUSTOM_SIGNATURES = [item for item in loaded if item.get("enabled", True)]
        CUSTOM_SIGNATURES_MTIME = mtime
        print(f"[bridge] Loaded {len(CUSTOM_SIGNATURES)} custom web signatures", flush=True)
    except Exception as exc:
        print(f"[bridge] Could not load custom signatures: {exc}", flush=True)

    return CUSTOM_SIGNATURES


def match_custom_access_alert(decoded: str, raw_target: str) -> Optional[tuple[str, str, str]]:
    for rule in load_custom_signatures():
        pattern = str(rule.get("pattern", "")).strip()
        if not pattern:
            continue

        match_type = str(rule.get("match_type", "contains")).lower()
        matched = False
        if match_type == "regex":
            try:
                matched = bool(re.search(pattern, decoded, flags=re.IGNORECASE)) or bool(
                    re.search(pattern, raw_target, flags=re.IGNORECASE)
                )
            except re.error as exc:
                print(f"[bridge] Skipping invalid custom regex {rule.get('id')}: {exc}", flush=True)
                continue
        else:
            needle = pattern.lower()
            matched = needle in decoded or needle in raw_target

        if matched:
            return (
                str(rule.get("title") or "Custom Web Signature"),
                str(rule.get("category") or "Web Custom"),
                str(rule.get("severity") or "medium").lower(),
            )
    return None


def is_sensor_candidate(raw: dict) -> bool:
    return raw.get("msg") == "Sensor: HTTP Flow Candidate"


def build_payload(raw: dict):
    msg = raw.get("msg", "Unknown Alert")
    priority = raw.get("priority", 3)
    proto = raw.get("proto", "TCP").upper()
    src_ip, src_port = split_ap(raw.get("src_ap", ""))
    dst_ip, dst_port = split_ap(raw.get("dst_ap", ""))
    b64 = raw.get("b64_data", "")
    seed = f"{raw.get('seconds')}|{raw.get('sid')}|{raw.get('src_ap')}|{raw.get('dst_ap')}|{b64[:48]}"
    event_id = hashlib.sha1(seed.encode("utf-8", errors="replace")).hexdigest()[:16]

    payload = {
        "type": classify(msg),
        "severity": severity_from_alert(msg, priority),
        "source_ip": src_ip,
        "destination_ip": dst_ip,
        "source_port": src_port,
        "destination_port": dst_port,
        "protocol": proto,
        "action": "logged",
        "payload_preview": f"[{msg}]" + (f" payload={b64[:120]}" if b64 else ""),
        "raw_request": extract_raw_request_from_alert(raw),
        "signature_msg": msg,
        "signature_class": raw.get("class"),
        "signature_sid": int(raw["sid"]) if str(raw.get("sid", "")).isdigit() else None,
        "signature_gid": int(raw["gid"]) if str(raw.get("gid", "")).isdigit() else None,
    }
    payload.update(write_capture_metadata(raw, payload, event_id))
    return payload


def match_access_alert(target: str) -> Optional[tuple[str, str, str]]:
    decoded = unquote_plus(target).lower()
    raw_target = target.lower()
    custom_match = match_custom_access_alert(decoded, raw_target)
    if custom_match:
        return custom_match
    for title, category, severity, needles in WEB_SIGNATURES:
        if any(needle in decoded or needle in raw_target for needle in needles):
            return title, category, severity
    return None


def build_access_payload(line: str) -> Optional[dict]:
    match = ACCESS_RE.match(line)
    if not match:
        return None

    signature = match_access_alert(match.group("target"))
    if not signature:
        return None

    title, category, severity = signature
    source_ip = match.group("src")
    target = match.group("target")
    event_id = hashlib.sha1(f"nginx|{line}".encode("utf-8", errors="replace")).hexdigest()[:16]
    raw = {
        "seconds": int(datetime.now(timezone.utc).timestamp()),
        "msg": title,
        "priority": {"critical": 1, "high": 2, "medium": 3}.get(severity, 4),
        "class": category,
        "src_ap": f"{source_ip}:0",
        "dst_ap": f"{SENSOR_IP}:80",
        "proto": "TCP",
        "sid": 9910000,
        "gid": 1,
        "rev": 1,
        "source": "nginx-access-event-capture",
        "request": f"{match.group('method')} {target}",
        "status": match.group("status"),
    }
    payload = {
        "type": category,
        "severity": severity,
        "source_ip": source_ip,
        "destination_ip": SENSOR_IP,
        "source_port": None,
        "destination_port": 80,
        "protocol": "TCP",
        "action": "logged",
        "payload_preview": f"[{title}] request={match.group('method')} {target} status={match.group('status')}",
        "raw_request": f"{match.group('method')} {target} HTTP status={match.group('status')}",
        "signature_msg": title,
        "signature_class": category,
        "signature_sid": raw["sid"],
        "signature_gid": raw["gid"],
    }
    payload.update(write_capture_metadata(raw, payload, event_id))
    return payload


async def post_payload(client: httpx.AsyncClient, payload: dict) -> None:
    for attempt in range(1, 4):
        try:
            response = await client.post(
                f"{BACKEND}/alerts/ingest",
                json=payload,
                headers={"x-api-key": current_api_key()},
                timeout=8.0,
            )
            status = "OK" if response.status_code == 201 else f"HTTP {response.status_code}"
            print(f"[bridge] {status} {payload['type']} {payload['source_ip']} -> {payload['destination_ip']}", flush=True)
            if response.status_code == 201:
                return
        except Exception as exc:
            print(f"[bridge] POST attempt {attempt} failed: {exc}", flush=True)
        await asyncio.sleep(min(attempt * 2, 5))


async def tail_and_send():
    print(f"[bridge] Watching {SNORT_LOG} -> {BACKEND}", flush=True)
    last_inode = None
    position = 0
    recent = deque(maxlen=MAX_RECENT_EVENTS)

    async with httpx.AsyncClient() as client:
        while True:
            if not SNORT_LOG.exists():
                print("[bridge] Waiting for Snort alert file...", flush=True)
                await asyncio.sleep(REOPEN_INTERVAL)
                continue

            stat = SNORT_LOG.stat()
            inode = getattr(stat, "st_ino", None)
            if last_inode != inode or stat.st_size < position:
                first_open = last_inode is None
                last_inode = inode
                position = stat.st_size if first_open else 0
                print(f"[bridge] Opened alert file at offset {position}", flush=True)

            with SNORT_LOG.open("r", encoding="utf-8", errors="replace") as handle:
                handle.seek(position)
                while True:
                    line = handle.readline()
                    if not line:
                        position = handle.tell()
                        break

                    position = handle.tell()
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        raw = json.loads(line)
                    except json.JSONDecodeError:
                        print("[bridge] Skipped partial JSON line", flush=True)
                        continue

                    if is_sensor_candidate(raw):
                        print("[bridge] Snort sensor heartbeat observed", flush=True)
                        continue

                    payload = build_payload(raw)
                    if payload["event_id"] in recent:
                        continue
                    recent.append(payload["event_id"])
                    pcap_path = await capture_event_pcap(payload["event_id"], payload.get("packet_filter") or "tcp")
                    if not payload.get("raw_request") and pcap_path:
                        payload["raw_request"] = extract_raw_request_from_pcap(pcap_path)
                    await post_payload(client, payload)

            await asyncio.sleep(POLL_INTERVAL)


async def tail_nginx_access():
    print(f"[bridge] Watching {NGINX_ACCESS_LOG} for proxy web signatures", flush=True)
    last_inode = None
    position = 0
    recent = deque(maxlen=512)

    async with httpx.AsyncClient() as client:
        while True:
            if not NGINX_ACCESS_LOG.exists():
                await asyncio.sleep(REOPEN_INTERVAL)
                continue

            stat = NGINX_ACCESS_LOG.stat()
            inode = getattr(stat, "st_ino", None)
            if last_inode != inode or stat.st_size < position:
                first_open = last_inode is None
                last_inode = inode
                position = stat.st_size if first_open else 0
                print(f"[bridge] Opened nginx access log at offset {position}", flush=True)

            with NGINX_ACCESS_LOG.open("r", encoding="utf-8", errors="replace") as handle:
                handle.seek(position)
                while True:
                    line = handle.readline()
                    if not line:
                        position = handle.tell()
                        break

                    position = handle.tell()
                    line = line.strip()
                    if not line:
                        continue
                    digest = hashlib.sha1(line.encode("utf-8", errors="replace")).hexdigest()
                    if digest in recent:
                        continue
                    recent.append(digest)

                    payload = build_access_payload(line)
                    if payload:
                        await post_payload(client, payload)

            await asyncio.sleep(POLL_INTERVAL)


async def run_forever(name: str, coro_factory):
    while True:
        try:
            await coro_factory()
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            print(f"[bridge] {name} crashed, restarting in {REOPEN_INTERVAL}s: {exc}", flush=True)
            await asyncio.sleep(REOPEN_INTERVAL)


async def main():
    tasks = [run_forever("snort-tail", tail_and_send)]
    if ENABLE_EVENT_PCAP:
        tasks.append(run_forever("rolling-pcap", rolling_pcap_capture))
    if ENABLE_NGINX_SIGNATURE_FALLBACK:
        tasks.append(run_forever("nginx-access-tail", tail_nginx_access))
    else:
        print("[bridge] Nginx signature fallback disabled; ingesting Snort JSON only", flush=True)
    await asyncio.gather(*tasks)


if __name__ == "__main__":
    asyncio.run(main())
