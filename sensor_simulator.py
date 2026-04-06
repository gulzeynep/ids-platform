import requests
import random
import time

# --- AYARLAR ---
BASE_URL = "http://localhost:8000"
EMAIL = "dev@wids.com"      # <-- Kendi emaili yaz
PASSWORD = "12345"            # <-- Kendi şifreni yaz

print("🛡️ W-IDS Sensör Simülatörü Başlatılıyor...")

# 1. SİSTEME GİRİŞ YAP VE TOKEN AL
try:
    login_res = requests.post(f"{BASE_URL}/auth/token", data={"username": EMAIL, "password": PASSWORD})
    if login_res.status_code != 200:
        print("❌ Giriş başarısız! Email veya şifreni kontrol et.")
        exit()
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Giriş başarılı! Token alındı.\n")
except Exception as e:
    print(f"Sunucuya bağlanılamadı: {e}")
    exit()

# 2. SALDIRI VERİLERİ HAVUZU
attack_types = ["SQL Injection", "Brute Force", "DDoS Attempt", "XSS Payload", "Port Scan", "Malware Callback"]
severities = ["low", "medium", "high", "critical"]
actions = ["logged", "blocked", "allowed"]
protocols = ["TCP", "UDP", "HTTP", "ICMP"]
destination_ips = ["192.168.1.10", "192.168.1.50", "10.0.0.5", "10.0.0.100"]
target_ports = [80, 443, 22, 3306, 5432, 21]

# 3. SİMÜLASYONU BAŞLAT (Sonsuz Döngü)
print("🔥 Kırmızı Takım Saldırısı Başlıyor! (Durdurmak için terminalde CTRL+C tuşlarına bas)\n")

counter = 1
while True: # ARTIK ASLA DURMAYACAK!
    hacker_ip = f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}"
    
    alert_payload = {
        "type": random.choice(attack_types),
        "severity": random.choice(severities),
        "source_ip": hacker_ip,
        "destination_ip": random.choice(destination_ips),
        "source_port": random.randint(1024, 65535),
        "destination_port": random.choice(target_ports),
        "protocol": random.choice(protocols),
        "action": random.choice(actions)
    }

    try:
        res = requests.post(f"{BASE_URL}/alerts/", json=alert_payload, headers=headers)
        if res.status_code == 200:
            print(f"[{counter}] 🚀 Saldırı İletildi: {alert_payload['type']} (Hedef: {alert_payload['destination_ip']})")
        else:
            print(f"[{counter}] ❌ Hata: {res.text}")
    except Exception as e:
        print(f"[{counter}] ❌ İstek atılamadı: {e}")

    counter += 1
    # 2 ile 5 saniye arası rastgele bekle, sonra yeni saldırı yolla
    time.sleep(random.uniform(2.0, 5.0))