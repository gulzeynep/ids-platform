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


