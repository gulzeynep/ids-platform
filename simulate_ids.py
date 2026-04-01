import requests
import time
import random

URL =  "http://localhost:8000/alerts/ingest"
HEADERS = {"X-IDS-KEY": "IDS_SECRET_ENGINE_KEY_2026"}

attack_types  =["SQL Injection", "XSS Attack", "DDos Attack", "Brute Force "]
severity_levels = ["Low", "Medium", "High", "Critical"]

def send_fake_alert():
    data = {
        "type": random.choice(attack_types),
        "severity": random.choice(severity_levels),
        "source_ip": f"192.168.1.{random.randint(1,254)}",
        "owner_id": 1
    }
    try:
        response = requests.post(URL, json = data, headers = HEADERS)
        if response.status_code == 201:
            print(f"Alert sent: {data['type']} ({data['severity']})")
        else:
            print(f"Failed to send alert: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error sending alert: {e}")
    print(response.status_code, response.text)

if __name__ == "__main__":
    print("Starting IDS alert simulation...")
    while True:
        send_fake_alert()
        time.sleep(2)

    