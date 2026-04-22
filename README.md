
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
```
Ana dizinde bir .env dosyası oluşturun ve içine şu kritik çevresel değişkenleri ekleyin (geliştirme ortamı için):
```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@ids_postgres:5432/ids_db
SECRET_KEY=super_gizli_jwt_anahtari_buraya_gelecek
ALGORITHM=HS256
API_KEY=ids_engine_icin_gizli_api_anahtari
```
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
## 👑 İlk Yönetici Hesabını (Super Admin) Oluşturma
Sistem "Multi-tenant" çalıştığı için, yeni bir kurulumda içeride hiç şirket veya kullanıcı olmaz. Sistemi kontrol etmek için kendinizi "Developer / Super Admin" yapmalısınız:

**Adım 1:** Tarayıcıdan http://localhost:5173/register adresine gidin ve normal bir kayıt yapın.

* Email: dev@wids.com

* Operator Name: developer

* Organization: W-IDS HQ

* Password: 12345

**Adım 2:** Veritabanına manuel müdahale ederek kendinize tam yetki verin. Yeni bir terminal açın ve şu komutları çalıştırın:
```bash
# Postgres konteynerine bağlanın
docker exec -it ids_postgres psql -U postgres -d ids_db

# Kayıt olduğunuz email adresine admin ve developer yetkisi verin
UPDATE users SET is_admin = true, role = 'developer' WHERE email = 'dev@wids.com';

# Çıkış yapın
\q
```
**Adım 3:** Sisteme (http://localhost:5173) dev@wids.com ve 12345 şifresiyle giriş yapın. Üst menüde kırmızı kalkanlı Admin Console butonunu göreceksiniz.
***
## 📂 Proje Yapısı
* /frontend: Kullanıcı arayüzü kodları (React + Vite). Ana giriş noktası src/App.tsx.

* /backend: API ve iş mantığı.

* * /src/api: Endpoint'ler (auth.py, alerts.py, admin.py).

* * /src/models.py: Veritabanı tabloları (Company, User, Alert).

* * /src/schemas.py: Veri doğrulama ve transfer objeleri (Pydantic).

* docker-compose.yml: Tüm servislerin orkestrasyonu.

* simulate_ids.py: Test amaçlı sisteme sahte saldırı logları gönderen Python betiği.
***
## 🛠️ Sorun Giderme (Troubleshooting)
### 1. Veritabanı Hataları (Relation not found vb.):
Modellerde (models.py) bir değişiklik yaptıysanız ve veritabanı sapıttıysa, eski verileri tamamen silip sıfırdan kurmak en kesin çözümdür:
```bash
docker-compose down -v  # -v parametresi tüm veritabanı kayıtlarını siler!
docker-compose up --build
```
### 2. 404 Not Found Hataları:
Frontend'den backend'e istek atarken 404 alıyorsanız, endpoint yollarını kontrol edin (Örn: /register değil /auth/register olmalıdır).
### 3. Frontend Güncellenmiyor:
Vite bazen Docker içinde anlık yenilemeyi (HMR) kaçırabilir. Sayfayı Ctrl + F5 (Hard Reload) ile yenileyin.

***


