
# W-IDS (Web-Intrusion Detection System) Core Platform 

Bu proje, ağ üzerindeki siber tehditleri gerçek zamanlı olarak algılayan, çoklu şirket (Multi-tenant) destekli, Rol Bazlı Erişim Kontrolü (RBAC) içeren bir siber güvenlik izleme platformudur.

## 🏗️ Teknoloji Yığını
* **Frontend:** React, TypeScript, Zustand, React Query, Vite, TailwindCSS, Recharts, Lucide Icons
* **Backend:** Python, FastAPI, SQLAlchemy (Async), JWT Authentication
* **Veritabanı & Önbellek:** PostgreSQL, Redis
* **Altyapı:** Docker & Docker Compose

---

##  Başlangıç (Sıfırdan Kurulum)

### 1. Gereksinimler
Bilgisayarınızda şunların yüklü olduğundan emin olun:
* **Docker** ve **Docker Compose**
* **Git** 

### 2. Projeyi İndirme ve Ortam Hazırlığı
* Terminali açın ve projeyi klonlayın (veya dosyaları yeni bilgisayara kopyalayın):
```bash
git clone <repo_url>
cd ids-platform
```
* .env.example doyasını baz alarak .env dosyalarınızı oluşturun.

### 3. Sistemi Ayağa Kaldırma
Tüm servisleri (Frontend, Backend, Postgres, Redis, Worker) tek komutla inşa edip başlatın:

```bash
docker-compose up --build
```
Not: İlk kurulumda veritabanı imajlarının indirilmesi birkaç dakika sürebilir.

Sistem ayağa kalktığında:

* Frontend (Arayüz): http://localhost:5173

* Backend (API Docs): http://localhost:8000/docs adresinden erişilebilir olacaktır.
***
##  İlk Yönetici Hesabını (Admin) Oluşturma
Sistem "Multi-tenant" çalıştığı için, yeni bir kurulumda içeride hiç şirket veya kullanıcı olmaz. Platformda yeni bir şirket için workspace açan ilk kullanıcı admin olur ve tüm yetkiler ona aittir. 

**Kayıt Yapın :** Tarayıcıdan http://localhost:5173/register adresine gidin ve normal bir kayıt yapın.

* Email: dev@wids.com

* Operator Name: developer

* Organization: W-IDS HQ

* Password: 12345

**Databaseden Manuel yetki verme işlemi :** Veritabanına manuel müdahale ederek kendinize tam yetki verin. Yeni bir terminal açın ve şu komutları çalıştırın:
```bash
# Postgres konteynerine bağlanın
docker exec -it ids_postgres psql -U postgres -d ids_db

# Kayıt olduğunuz email adresine admin ve developer yetkisi verin
UPDATE users SET is_admin = true, role = 'developer' WHERE email = 'dev@wids.com';

# Çıkış yapın
\q
```
***
##  Proje Yapısı
* /frontend: Kullanıcı arayüzü kodları. Ana giriş noktası src/App.tsx.

* /backend: API ve iş mantığı.

* * /src/api: Endpoint'ler (auth.py, alerts.py, admin.py).

* * /src/models.py: Veritabanı tabloları (Company, User, Alert).

* * /src/schemas.py: Veri doğrulama ve transfer objeleri (Pydantic).

* docker-compose.yml: Tüm servislerin orkestrasyonu.

* simulate_ids.py: Test amaçlı sisteme sahte saldırı logları gönderen Python betiği.
***