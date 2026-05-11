"""
Resilient Snort alert bridge.

Reads Snort3 alert_json.txt, tolerates file rotation/truncation, creates a
small event-capture record, and POSTs each alert to /alerts/ingest.
"""
import asyncio
import hashlib
import json
import os
import re
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote_plus
from typing import Optional

import httpx


SNORT_LOG = Path(os.environ.get("SNORT_ALERT_LOG", "/var/log/snort/alert_json.txt"))
NGINX_ACCESS_LOG = Path(os.environ.get("NGINX_ACCESS_LOG", "/var/log/nginx/access.log"))
CAPTURE_DIR = Path(os.environ.get("SNORT_CAPTURE_DIR", "/var/log/snort/event_captures"))
BACKEND = os.environ.get("BACKEND_URL", "http://ids_backend:8000")
API_KEY = os.environ.get("SNORT_API_KEY") or os.environ.get("API_KEY", "")
POLL_INTERVAL = float(os.environ.get("SNORT_BRIDGE_POLL_INTERVAL", "0.25"))
REOPEN_INTERVAL = float(os.environ.get("SNORT_BRIDGE_REOPEN_INTERVAL", "2"))
SENSOR_IP = os.environ.get("IDS_SENSOR_IP", "172.18.0.7")

PRIORITY_MAP = {1: "critical", 2: "high", 3: "medium", 4: "low"}
ACCESS_RE = re.compile(r'^(?P<src>\S+) \S+ \S+ \[[^\]]+\] "(?P<method>[A-Z]+) (?P<target>\S+) HTTP/[^"]+" (?P<status>\d+)')
WEB_SIGNATURES = [
    ("Critical: Shadow File Access", "Path Traversal", "critical", ["/etc/shadow"]),
    ("High: Password File Disclosure Attempt", "Path Traversal", "high", ["/etc/passwd"]),
    ("High: Acunetix Scanner Probe", "Port Scan", "high", ["/acunetix-wvs-test-for-some-inexistent-file"]),
    ("Critical: SQL Union Select Injection", "SQL Injection", "critical", ["union select", "union+select", "union%20select"]),
    ("High: Script Tag XSS Attempt", "XSS", "high", ["<script", "%3cscript"]),
    ("High: Environment File Disclosure", "Path Traversal", "high", ["/.env", ".env"]),
    ("High: WordPress Config Disclosure", "Path Traversal", "high", ["wp-config.php"]),
    ("Medium: phpMyAdmin Probe", "Port Scan", "medium", ["phpmyadmin"]),
    ("Critical: Log4Shell JNDI Lookup", "Exploit Attempt", "critical", ["${jndi:", "%24%7bjndi"]),
]


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
    if any(k in m for k in ["shellcode", "exploit", "overflow", "injection"]):
        return "Exploit Attempt"
    if any(k in m for k in ["malware", "backdoor", "cnc"]):
        return "Malware"
    if any(k in m for k in ["brute", "login fail"]):
        return "Brute Force"
    if any(k in m for k in ["icmp", "ping"]):
        return "ICMP Probe"
    return "Intrusion Attempt"


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


def write_capture_metadata(raw: dict, payload: dict, event_id: str) -> dict:
    CAPTURE_DIR.mkdir(parents=True, exist_ok=True)
    capture_path = CAPTURE_DIR / f"{event_id}.json"
    metadata = {
        "event_id": event_id,
        "capture_mode": "event_metadata",
        "capture_window_seconds": 10,
        "packet_filter": packet_filter(
            payload["source_ip"],
            payload["source_port"],
            payload["destination_ip"],
            payload["destination_port"],
            payload["protocol"],
        ),
        "pcap_directory": "/var/log/snort",
        "note": "Snort packet logging is size-limited; this record preserves the event context used to locate matching packets.",
        "raw_alert": raw,
    }
    capture_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "event_id": event_id,
        "capture_path": str(capture_path),
        "capture_mode": metadata["capture_mode"],
        "packet_filter": metadata["packet_filter"],
        "capture_window_seconds": metadata["capture_window_seconds"],
    }


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
        "severity": PRIORITY_MAP.get(int(priority) if priority else 3, "medium"),
        "source_ip": src_ip,
        "destination_ip": dst_ip,
        "source_port": src_port,
        "destination_port": dst_port,
        "protocol": proto,
        "action": "logged",
        "payload_preview": f"[{msg}]" + (f" payload={b64[:120]}" if b64 else ""),
    }
    payload.update(write_capture_metadata(raw, payload, event_id))
    return payload


def match_access_alert(target: str) -> Optional[tuple[str, str, str]]:
    decoded = unquote_plus(target).lower()
    raw_target = target.lower()
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
    }
    payload.update(write_capture_metadata(raw, payload, event_id))
    return payload


async def post_payload(client: httpx.AsyncClient, payload: dict) -> None:
    for attempt in range(1, 4):
        try:
            response = await client.post(
                f"{BACKEND}/alerts/ingest",
                json=payload,
                headers={"x-api-key": API_KEY},
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

    async with httpx.AsyncClient() as client:
        while True:
            if not SNORT_LOG.exists():
                print("[bridge] Waiting for Snort alert file...", flush=True)
                await asyncio.sleep(REOPEN_INTERVAL)
                continue

            stat = SNORT_LOG.stat()
            inode = getattr(stat, "st_ino", None)
            if last_inode != inode or stat.st_size < position:
                last_inode = inode
                position = stat.st_size
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
                last_inode = inode
                position = stat.st_size
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


async def main():
    await asyncio.gather(tail_and_send(), tail_nginx_access())


if __name__ == "__main__":
    asyncio.run(main())
