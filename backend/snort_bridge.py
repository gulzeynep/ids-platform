"""
snort_bridge.py — Reads Snort3 alert_json.txt and POSTs to /alerts/ingest
Run as: python snort_bridge.py
"""
import json
import time
import os
import httpx
import asyncio

SNORT_LOG = "/var/log/snort/alert_json.txt"
BACKEND   = "http://ids_backend:8000"
API_KEY   = os.environ.get("API_KEY", "")

PRIORITY_MAP = {1: "critical", 2: "high", 3: "medium", 4: "low"}

def classify(msg: str) -> str:
    m = msg.lower()
    if any(k in m for k in ["sql", "union select", "xp_cmd"]): return "SQL Injection"
    if any(k in m for k in ["xss", "script", "cross-site"]):   return "XSS"
    if any(k in m for k in ["scan", "nmap", "nikto", "probe"]): return "Port Scan"
    if any(k in m for k in ["traversal", "passwd", "../"]):      return "Path Traversal"
    if any(k in m for k in ["shellcode", "exploit", "overflow"]): return "Exploit Attempt"
    if any(k in m for k in ["malware", "backdoor", "cnc"]):      return "Malware"
    if any(k in m for k in ["brute", "login fail"]):             return "Brute Force"
    if any(k in m for k in ["icmp", "ping"]):                    return "ICMP Probe"
    return "Intrusion Attempt"

def split_ap(ap: str):
    if not ap: return "0.0.0.0", None
    if ":" in ap:
        parts = ap.rsplit(":", 1)
        return parts[0], int(parts[1]) if parts[1].isdigit() else None
    return ap, None

def build_payload(raw: dict):
    msg      = raw.get("msg", "Unknown Alert")
    priority = raw.get("priority", 3)
    proto    = raw.get("proto", "TCP").upper()
    src_ip,  src_port  = split_ap(raw.get("src_ap", ""))
    dst_ip,  dst_port  = split_ap(raw.get("dst_ap", ""))
    b64      = raw.get("b64_data", "")
    return {
        "type":             classify(msg),
        "severity":         PRIORITY_MAP.get(int(priority) if priority else 3, "medium"),
        "source_ip":        src_ip,
        "destination_ip":   dst_ip,
        "source_port":      src_port,
        "destination_port": dst_port,
        "protocol":         proto,
        "action":           "logged",
        "payload_preview":  f"[{msg}]" + (f" payload={b64[:80]}" if b64 else ""),
    }

async def tail_and_send():
    print(f"[bridge] Watching {SNORT_LOG} → {BACKEND}")
    while not os.path.exists(SNORT_LOG):
        print("[bridge] Waiting for log file..."); await asyncio.sleep(3)

    async with httpx.AsyncClient() as client:
        with open(SNORT_LOG, "r", errors="replace") as f:
            f.seek(0, 2)  # start from end, skip history
            print("[bridge] Tailing from end of log...")
            while True:
                line = f.readline()
                if not line:
                    await asyncio.sleep(0.25); continue
                line = line.strip()
                if not line: continue
                try:
                    raw     = json.loads(line)
                    payload = build_payload(raw)
                    r = await client.post(
                        f"{BACKEND}/alerts/ingest",
                        json=payload,
                        headers={"x-api-key": API_KEY},
                        timeout=5.0,
                    )
                    status = "✅" if r.status_code == 201 else f"⚠️ {r.status_code}"
                    print(f"[bridge] {status} {payload['type']} {payload['source_ip']} → {payload['destination_ip']}")
                except json.JSONDecodeError:
                    pass
                except Exception as e:
                    print(f"[bridge] Error: {e}"); await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(tail_and_send())