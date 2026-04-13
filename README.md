# 🛡️ W-IDS: Web Intrusion Detection System
**Command Center & Threat Intelligence Platform**

W-IDS is a highly scalable, multi-tenant SaaS platform designed to monitor, analyze, and neutralize web-based threats in real-time. This repository contains both the Asynchronous FastAPI backend and the React/Vite frontend, fully containerized for modern deployment.

---

## 📂 Project Structure & Directory Guide

The project is structured as a monorepo containing distinct micro-services. Here is what each file and directory does:

### 1. `backend/` (The Brain)
Handles all business logic, database operations, and API endpoints.
* **`Dockerfile`**: Container blueprint for the Python FastAPI server.
* **`requirements.txt`**: Python dependencies (FastAPI, SQLAlchemy, asyncpg, etc.).
* **`alembic/` & `alembic.ini`**: Database migration tools. Tracks changes to database tables.
* **`src/main.py`**: The entry point of the backend. Initializes the FastAPI app and includes routers.
* **`src/models.py`**: SQLAlchemy database models (e.g., `User`, `Workspace`). Defines how data is stored.
* **`src/schemas.py`**: Pydantic models. Defines how data is validated when coming in or going out of the API.
* **`src/database.py`**: PostgreSQL connection setup using asynchronous engine (`asyncpg`).
* **`src/api/`**: Contains API routes.
  * `auth.py`: Login, Registration, and Workspace Onboarding logic.
  * `admin.py`: Team management, RBAC (Role-Based Access Control), and Operative deployment.
* **`src/core/security.py`**: JWT token generation, password hashing, and user authentication guards.

### 2. `frontend/` (The Console)
The user interface where analysts and admins monitor threats.
* **`Dockerfile`**: Multi-stage build file. Compiles React code and serves it using an ultra-fast Nginx web server.
* **`package.json`**: Node.js dependencies and build scripts.
* **`vite.config.ts`**: Configuration for the Vite build tool.
* **`src/App.tsx`**: Main React component and router setup.
* **`src/components/`**: Reusable UI parts.
  * `Management.tsx`: The Command & Control page for managing team access and sensor deployment.
  * `AttackMap.tsx`: Visual representation of global threat origins.
* **`src/lib/api.ts`**: Axios configuration for making HTTP requests to the backend (handles JWT injection).

### 3. Root Level Files (The Orchestrator)
* **`docker-compose.yml`**: The master conductor. It spins up the Database (PostgreSQL), Cache (Redis), Backend, Worker, and Frontend within the same isolated virtual network (`wids-network`).
* **`.env`**: Environment variables (Database credentials, JWT secret keys). *Never commit this to version control.*

---

## 🚀 Installation & Quick Start

Follow these steps to deploy the entire stack locally using Docker.

### Prerequisites
* Docker Engine & Docker Compose installed on your machine.
* Git

### Step 1: Clone the Repository
```bash
git clone [https://github.com/your-username/w-ids.git](https://github.com/your-username/w-ids.git)
cd w-ids
```
### Step 2: Environment Configuration
Ensure you have a .env file in the root directory (or inside the backend/ directory, depending on your setup) containing your database credentials and secret keys:
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=12345
POSTGRES_DB=ids_db
JWT_SECRET_KEY=your_super_secret_key_here
```
### Step 3: Build and Spin Up Containers
Use Docker Compose to build the images and start the services in detached mode:
```bash
docker compose up --build -d
```

### Step 4: Run Database Migrations
Once the database container is up, create the tables by running Alembic inside the backend container:
```bash
docker compose exec backend alembic upgrade head
```

## 🌐 Service Access Points
Once the containers are running, you can access the services via your browser:

* Command Center (Frontend): http://localhost:5173

* Backend API Base URL: http://localhost:8000

* Interactive API Docs (Swagger): http://localhost:8000/docs


*********

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




