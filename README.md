# W-IDS Local Demo

W-IDS is a local web intrusion detection demo with FastAPI, PostgreSQL, Redis,
Snort3, an Nginx reverse proxy, and a React dashboard.

## Services

- `backend`: FastAPI API, auth, admin panel, alert ingest.
- `worker`: consumes Redis alert jobs, writes alerts to PostgreSQL, broadcasts WebSocket events.
- `reverse-proxy`: Nginx gateway exposed as `http://localhost:8080`.
- `secure-engine`: Snort3 watching the gateway network namespace.
- `snort-bridge`: active alert reader; reads Snort JSON and Nginx access logs, then posts to `/alerts/ingest`.
- `demo-origin`: local upstream test site for `app.example.com`.
- `db` and `redis`: runtime persistence and queue.

`backend/snort_reader.py` is legacy and is not used by the Compose pipeline.

## Environment

The root `.env` file is the Docker Compose source of truth. Copy
`.env.example` to `.env` if you need to recreate it.

For Docker, keep:

```env
POSTGRES_PASSWORD=12345
DATABASE_URL=postgresql+asyncpg://postgres:12345@db:5432/ids_db
API_KEY=ids_engine_icin_gizli_api_anahtari
SNORT_API_KEY=ids_engine_icin_gizli_api_anahtari
```

`backend/.env.example` is only for running the backend outside Docker. In that
case it points PostgreSQL to `127.0.0.1:5434`.

## Start

```powershell
docker compose up -d --build
```

Backend migrations and local demo seeding run automatically on backend startup.
Existing data is preserved.

Run the frontend locally:

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open:

- Dashboard: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`
- Gateway: `http://localhost:8080`

Demo login:

- Email: `demo@wids.local`
- Password: `DemoPass123!`

The seeder will not overwrite an existing demo user's password unless
`RESET_DEMO_ADMIN_PASSWORD=true` is set.

## Test The IDS Path

The seeded protected site is:

- Public host: `app.example.com`
- Gateway: `http://127.0.0.1:8080`
- Origin: `demo-origin:8081`

Use the Host header so the request hits the protected-site Nginx server block:

```powershell
curl.exe -i -H "Host: app.example.com" http://127.0.0.1:8080/etc/passwd
curl.exe -i -H "Host: app.example.com" http://127.0.0.1:8080/.env
curl.exe -i -H "Host: app.example.com" "http://127.0.0.1:8080/search?q=union%20select"
curl.exe -i -H "Host: app.example.com" "http://127.0.0.1:8080/?q=%3Cscript%3E"
```

A 404 from the demo origin is fine. The important result is that the gateway
access log is inspected and alerts appear in Dashboard/Intrusions with specific
titles like `High: Password File Disclosure Attempt`.

## Runtime Flow

1. User logs in with the demo admin.
2. Requests go to `ids-gateway` on `localhost:8080`.
3. `ids-gateway` routes `Host: app.example.com` to `demo-origin:8081`.
4. `secure-engine` watches the gateway network namespace with Snort3.
5. `snort_bridge.py` reads Snort JSON and Nginx access logs.
6. The bridge posts alerts to `/alerts/ingest` with the workspace API key.
7. Backend queues alerts in Redis.
8. `ids_worker` writes alerts to PostgreSQL and broadcasts WebSocket events.
9. Dashboard/Intrusions display `signature_msg` as the alert title.

## Useful Checks

```powershell
docker compose ps
docker logs ids_backend --tail 80
docker logs ids_worker --tail 80
docker logs ids_snort_bridge --tail 80
docker exec ids_postgres psql -U postgres -d ids_db -c "\d alerts"
docker exec ids_postgres psql -U postgres -d ids_db -c "\d monitored_websites"
```

Build frontend:

```powershell
cd frontend
npm run build
```
