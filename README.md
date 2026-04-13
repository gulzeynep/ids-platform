# W-IDS Core | Advanced Intrusion Detection Platform

A professional, full-stack, real-time Web-IDS analysis platform designed for modern security operations. Built with a high-performance **FastAPI** backend and a reactive **React/Vite** frontend.

## 🛡️ Core Features
- **Real-time Stream:** WebSockets for millisecond-level threat visibility.
- **Service-Oriented Architecture:** Decoupled business logic with dedicated Service layers.
- **Asynchronous Engine:** Fully async database operations using SQLAlchemy + Asyncpg.
- **Interactive Analytics:** Deep traffic analysis using TanStack Query & Recharts.
- **Dockerized Environment:** One-click deployment for local and production testing.

## 🚀 Tech Stack
- **Backend:** Python 3.14, FastAPI, Pydantic V2, SQLAlchemy, Alembic, Redis.
- **Frontend:** React 19, Vite, TypeScript, TailwindCSS, Zustand, TanStack Query.
- **DevOps:** Docker, Docker Compose, PostgreSQL.

## 🛠️ Quick Start
1. Clone the repository.
2. Create a `.env` file based on `.env.example`.
3. Launch the platform:
   ```bash
   docker-compose up --build
   ```
4. Access the dashboard at http://localhost:5173.

