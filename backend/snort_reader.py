"""Legacy fast-alert reader.

The active Docker Compose pipeline uses snort_bridge.py, which reads Snort3
alert_json output plus Nginx access logs. Keep this file only as a manual
fallback for older alert_fast.txt experiments.
"""
import re
import time
import requests
import os

ALERT_FILE = "/var/log/snort/alert_fast.txt"
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
API_KEY = os.getenv("SNORT_API_KEY")  # Your workspace API key

# Parses: 04/30-19:22:14 [**] [1:1000002:1] "Backend Access Attempt" [**] [Priority: 0] {TCP} 192.168.1.1:1234 -> 10.0.0.1:8000
ALERT_PATTERN = re.compile(
    r'(\d+/\d+-[\d:]+\.\d+)\s+\[\*\*\]\s+\[[\d:]+\]\s+"([^"]+)"\s+\[\*\*\].*?\{(\w+)\}\s+([\d.]+)(?::(\d+))?\s+->\s+([\d.]+)(?::(\d+))?'
)

def parse_severity(msg: str) -> str:
    msg_lower = msg.lower()
    if any(k in msg_lower for k in ["critical", "exploit", "shellcode", "backdoor", "cnc", "malware"]):
        return "critical"
    if any(k in msg_lower for k in ["scan", "traversal", "injection", "xss", "sql"]):
        return "high"
    if any(k in msg_lower for k in ["unusual", "suspicious", "policy"]):
        return "medium"
    return "low"

def tail_and_send():
    print(f"[snort-reader] Watching {ALERT_FILE}")
    with open(ALERT_FILE, "r") as f:
        f.seek(0, 2)  # Jump to end of file
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.5)
                continue
            match = ALERT_PATTERN.search(line)
            if not match:
                continue
            _, msg, proto, src_ip, src_port, dst_ip, dst_port = match.groups()
            payload = {
                "type": msg,
                "severity": parse_severity(msg),
                "source_ip": src_ip,
                "destination_ip": dst_ip,
                "source_port": int(src_port) if src_port else None,
                "destination_port": int(dst_port) if dst_port else None,
                "protocol": proto.upper(),
                "action": "logged",
                "payload_preview": line.strip(),
                "signature_msg": msg,
                "signature_class": "legacy-fast-alert",
            }
            try:
                r = requests.post(
                    f"{BACKEND_URL}/alerts/ingest",
                    json=payload,
                    headers={"x-api-key": API_KEY},
                    timeout=5
                )
                print(f"[snort-reader] Sent: {msg} → {r.status_code}")
            except Exception as e:
                print(f"[snort-reader] Error: {e}")

if __name__ == "__main__":
    # Wait for file to exist
    while not os.path.exists(ALERT_FILE):
        print(f"[snort-reader] Waiting for {ALERT_FILE}...")
        time.sleep(3)
    tail_and_send()
