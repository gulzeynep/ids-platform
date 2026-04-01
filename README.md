# W-IDS (Web-Intrusion Detection System) Core Platform 🛡️

Bu proje, ağ üzerindeki siber tehditleri (SQL Injection, Brute Force vb.) gerçek zamanlı olarak algılayan, çoklu şirket (Multi-tenant) destekli, Rol Bazlı Erişim Kontrolü (RBAC) içeren tam teşekküllü bir siber güvenlik izleme platformudur.

## 🏗️ Teknoloji Yığını
* **Frontend:** React, TypeScript, Vite, TailwindCSS, Recharts, Lucide Icons
* **Backend:** Python, FastAPI, SQLAlchemy (Async), JWT Authentication
* **Veritabanı & Önbellek:** PostgreSQL, Redis
* **Altyapı:** Docker & Docker Compose

---

## 🚀 Başlangıç (Sıfırdan Kurulum)

Projeyi yeni bir bilgisayarda çalıştırmak için aşağıdaki adımları sırasıyla izleyin.

### 1. Gereksinimler
Bilgisayarınızda şunların yüklü olduğundan emin olun:
* **Docker** ve **Docker Compose**
* **Git** (Projeyi çekmek için)

### 2. Projeyi İndirme ve Ortam Hazırlığı
Terminali açın ve projeyi klonlayın (veya dosyaları yeni bilgisayara kopyalayın):
```bash
git clone <repo_url>
cd ids-platform