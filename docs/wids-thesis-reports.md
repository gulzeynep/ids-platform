# W-IDS Thesis Reports

This document combines two thesis-ready sections generated for the `ids-health-mail-tests-analytics` branch:

1. W-IDS Platform: Web Intrusion Detection and Analysis System
2. Project Structure and File Responsibility Report

---

# W-IDS Platform: Web Intrusion Detection and Analysis System

## 1. Introduction

W-IDS is a Dockerized web intrusion detection and analysis platform designed to detect suspicious HTTP traffic, normalize security events, persist them for investigation, and present them through a SOC-style analyst dashboard. The system combines a reverse-proxy gateway, a Snort 3 detection engine, an asynchronous backend, a PostgreSQL database, Redis-based event processing, email notifications, and a React-based frontend.

The platform follows the core purpose of an intrusion detection and prevention system: observing potentially malicious activity, logging security-relevant events, supporting analyst investigation, and enabling response decisions [1]. In this project, the monitored environment is a local web demo environment, but the architecture models the same conceptual pipeline used in larger security monitoring systems: traffic enters a protected gateway, the IDS inspects it, alerts are converted into structured records, and analysts review the results through an operational interface.

[Insert Screenshot 1: Docker Compose services running]

[Insert Screenshot 2: High-level IDS architecture diagram]

## 2. System Architecture

The platform is orchestrated with Docker Compose, which allows multiple services to run together as one reproducible environment [5]. The main services are defined in `docker-compose.yml`.

The reverse proxy is implemented with Nginx. It acts as the protected gateway and forwards HTTP traffic to the demo origin service. Nginx also includes generated configuration files for protected sites and blocked IP rules. This makes it possible for backend state changes, such as adding a monitored website or blacklist entry, to affect gateway behavior.

Snort 3 is used as the IDS sensor. It runs in the network namespace of the Nginx gateway, which allows it to observe traffic that reaches the reverse proxy. Snort rule profiles include official web-related rules and local fallback signatures for common web attack patterns such as path traversal, environment file disclosure, SQL injection, XSS, and Log4Shell-style probes.

The `snort-bridge` service reads Snort JSON alerts from the Snort log directory, enriches them with normalized fields, optionally extracts raw HTTP requests or PCAP metadata, and sends them to the backend ingestion endpoint. The backend is built with FastAPI, which provides the REST APIs, authentication, alert management, analytics, settings, and WebSocket endpoints [6].

Redis has two roles. First, Redis Streams are used as an asynchronous queue between alert ingestion and alert persistence [8]. Second, Redis Pub/Sub is used to broadcast processed alert events to the backend WebSocket broadcaster. PostgreSQL stores durable application data: users, workspaces, alerts, notifications, monitored sites, blacklisted IPs, and detection rules [7].

The frontend is a React, TypeScript, and Vite application. It provides the analyst-facing interface for monitoring, triage, intelligence analysis, defense operations, rule management, settings, and notifications [10], [11].

## 2.1. Technology Stack and System Connections

The W-IDS platform combines infrastructure, detection, backend, database, messaging, frontend, notification, and testing technologies. Each technology has a specific role in the end-to-end IDS pipeline.

| Technology | What It Is | Purpose in the Project | Connection to Other Components |
|---|---|---|---|
| Docker Compose | Multi-container orchestration tool | Runs the platform as a reproducible local environment | Starts and connects backend, worker, PostgreSQL, Redis, Nginx, Snort, snort-bridge, and demo-origin services |
| Docker | Containerization platform | Packages runtime environments consistently | Provides isolated containers for Python backend, Snort engine, Nginx gateway, Redis, PostgreSQL, and demo origin |
| Python 3.12 | Backend programming language/runtime | Implements backend APIs, worker, bridge, simulator, and seeding logic | Used by FastAPI, SQLAlchemy, Redis client, mailer, tests, and bridge scripts |
| FastAPI | Python web API framework | Exposes authentication, alert ingestion, alert management, analytics, admin, defense, settings, and WebSocket endpoints | Receives data from snort-bridge, reads/writes PostgreSQL, queues Redis events, serves frontend API requests |
| Uvicorn | ASGI server | Runs the FastAPI application inside the backend container | Serves HTTP and WebSocket traffic for the backend |
| Pydantic / Pydantic Settings | Data validation and configuration library | Validates request/response schemas and loads `.env` configuration | Defines API contracts in `schemas.py` and runtime settings in `config.py` |
| SQLAlchemy Async ORM | Python ORM and database toolkit | Maps Python models to PostgreSQL tables using async sessions | Connects FastAPI routes and worker logic to database models such as `Alert`, `User`, and `Workspace` |
| Alembic | Database migration tool | Tracks and applies database schema changes | Evolves PostgreSQL schema for alerts, workspaces, blacklist, monitored websites, detection rules, and runtime fields |
| PostgreSQL | Relational database | Stores durable security and application data | Persists users, workspaces, alerts, notifications, blacklisted IPs, protected sites, and detection rules |
| asyncpg | Async PostgreSQL driver | Enables asynchronous PostgreSQL access from SQLAlchemy | Used through `DATABASE_URL=postgresql+asyncpg://...` |
| Redis Streams | Redis append-only stream structure | Queues IDS alert payloads between ingestion and processing | `/alerts/ingest` writes alerts; `worker.py` consumes and persists them |
| Redis Pub/Sub | Redis publish-subscribe messaging | Distributes processed alert events for real-time delivery | `worker.py` publishes events; `realtime.py` subscribes and broadcasts through WebSocket |
| Redis Key-Value Operations | In-memory data operations | Supports rate limiting and blacklist cache synchronization | Used by ingest rate limiting and defense blacklist logic |
| Nginx | Reverse proxy and gateway server | Receives protected web traffic and proxies it to the demo origin/backend | Traffic passing through Nginx is observed by Snort; generated configs control protected sites and deny rules |
| Nginx Reload Watcher | Shell-based config watcher | Reloads Nginx after generated config changes pass validation | Applies backend-generated protected-site and blacklist configuration without manual restart |
| Snort 3 | Network intrusion detection engine | Detects suspicious web traffic through official and local rules | Watches the Nginx gateway network namespace and writes JSON alerts |
| DAQ / AFPacket | Snort packet acquisition layer | Allows Snort to capture packets from the container network interface | Used by Snort in tap mode to observe HTTP traffic |
| Snort Rules | Detection signature definitions | Identify attack patterns such as path traversal, SQL injection, XSS, `.env` disclosure, and custom rules | Official rules and local/workspace rules feed Snort detection behavior |
| tcpdump / PCAP | Packet capture tooling and format | Captures short event windows and extracts raw HTTP request evidence | Used by `snort_bridge.py` to enrich alerts with capture paths and raw requests |
| snort_bridge.py | Python bridge service | Normalizes Snort JSON alerts and posts them to the backend ingest API | Connects Snort output to FastAPI `/alerts/ingest` |
| demo-origin | Local upstream demo web app | Provides a protected target behind Nginx | Receives proxied traffic for `app.example.com` demo requests |
| JWT | Token-based authentication mechanism | Authenticates API and WebSocket users | Created during login and used by protected routes and WebSocket handshake |
| python-jose | JWT implementation library | Encodes and decodes backend access tokens | Used by `security.py` and `ws.py` |
| bcrypt | Password hashing algorithm/library | Stores user passwords securely as hashes | Used during registration, login verification, and password changes |
| SlowAPI | Rate limiting library | Limits login attempts | Protects `/auth/token` from repeated brute-force attempts |
| HTTPX | Async HTTP client | Performs protected-site health checks and bridge/backend calls | Used by admin health checks and snort bridge posting |
| FastAPI-Mail / SMTP | Email delivery integration | Sends registration, settings confirmation, and alert emails | Connects backend and worker to external SMTP provider configured in `.env` |
| React | Frontend UI library | Builds the analyst-facing dashboard | Renders Overview, Intrusions, Intelligence, Defense, Detection Rules, Management, Settings, Notifications, and Profile pages |
| TypeScript | Typed JavaScript language | Adds static typing to frontend models and components | Defines alert, stats, settings, and WebSocket types used across frontend modules |
| Vite | Frontend dev/build tool | Runs the development server and production build | Builds the React dashboard and supports Vitest integration |
| React Router | Client-side routing library | Separates public auth pages and protected dashboard pages | Connects URL routes to Login, Register, Overview, Intrusions, Intelligence, and other screens |
| TanStack React Query | Data fetching and cache management library | Fetches backend API data with caching, refetching, loading, and error states | Powers dashboard stats, alert lists, detail queries, settings, and intelligence data |
| Zustand | Lightweight frontend state store | Stores auth state, UI theme, alert filters, live alerts, and WebSocket status | Persists JWT session and coordinates UI state across pages |
| Recharts | React charting library | Visualizes alert trends, severity distribution, protocol distribution, and attack type ratios | Used mainly by Overview and Intelligence pages |
| Tailwind CSS | Utility-first CSS framework | Provides dashboard styling and responsive layout utilities | Used across frontend components and pages |
| Lucide React | Icon library | Provides consistent UI icons for dashboard controls | Used in navigation, buttons, cards, settings, and alert actions |
| Sonner | Toast notification library | Shows frontend success/error and live alert notifications | Used for high/critical WebSocket alerts and settings feedback |
| Axios | HTTP client library | Sends frontend API requests to the backend | Used by `api/client.ts` and endpoint modules |
| Vitest | Frontend test runner | Runs unit and component tests | Verifies Register, Overview, Intelligence, Settings, and alert title behavior |
| React Testing Library | React component testing utility | Tests UI behavior from the user perspective | Used with Vitest to validate forms, empty states, and settings workflows |
| jsdom | Browser-like test environment | Provides DOM APIs during frontend tests | Allows React component tests to run in Node.js |
| ESLint | Static analysis/linting tool | Enforces frontend code quality rules | Used by `npm run lint` |
| Pytest | Python testing framework | Runs backend unit tests | Verifies analytics, mailer, worker, bridge payloads, blacklist sync, and alert contracts |

## 3. IDS Detection Pipeline

The detection pipeline begins when a user sends traffic through the Nginx gateway, typically using the `Host: app.example.com` header in the local demo setup. The gateway proxies this request to the demo origin while Snort observes the same traffic path.

[Insert Screenshot 3: Example malicious request sent through the Nginx gateway]

When Snort detects traffic that matches an enabled rule, it writes a JSON alert to `alert_json.txt`. The bridge service tails this file and transforms each raw Snort event into the application's canonical alert payload. This payload includes fields such as attack type, severity, source and destination IPs, ports, protocol, signature message, SID/GID, payload preview, event ID, capture path, and raw request when available.

The bridge then sends the normalized alert to `/alerts/ingest` with the workspace sensor API key. The backend validates this key, applies Redis-based rate limiting, and writes the alert payload into the Redis stream. This prevents alert ingestion from being tightly coupled to database writes.

[Insert Screenshot 4: Snort bridge log showing alert normalization and backend ingest]

The worker consumes Redis stream messages, creates `Alert` records in PostgreSQL, publishes WebSocket events through Redis Pub/Sub, and sends email notifications when the alert severity reaches the user's configured threshold. The frontend receives live alert events through a token-authenticated WebSocket connection and updates the dashboard in real time.

## 4. Backend Design and Features

The backend uses FastAPI as its application framework. The main application registers routers for authentication, alert ingestion and management, statistics, user settings, admin features, defense operations, and WebSocket communication. The backend structure is centered around `backend/src`, especially `main.py`, `models.py`, and `schemas.py`.

Authentication is JWT-based. Users register and log in through the auth API, and the frontend persists the token through Zustand storage. The backend validates this token for protected REST endpoints and for WebSocket authentication. A stale token can cause a WebSocket connection to be accepted and then closed with a policy violation, which explains the earlier open/close behavior observed during development.

The workspace model is central to the design. A workspace owns users, alerts, detection rules, monitored websites, blacklisted IPs, and notifications. The sensor API key belongs to the workspace, allowing the bridge to send events to the correct tenant context.

The `/alerts/ingest` endpoint verifies the API key and rate limits sensor traffic with Redis. The alert is not written directly to PostgreSQL at ingestion time; instead, it is queued. This improves resilience because temporary spikes in IDS events do not immediately block the HTTP ingestion path.

Alert management supports filtering by status, severity, flags, saved state, search text, and time range. Analysts can update alert status, add notes, flag important alerts, save alerts for later, and inspect details such as signature metadata, raw request content, and event capture information.

The analytics endpoints support both operational and intelligence views. Dashboard metrics include active alerts, critical threats, resolved alerts, protected sites, blocked IPs, recent alert counts, daily delta, hourly trend, attack type distribution, and success metrics. Intelligence metrics include top attackers, severity distribution, protocol distribution, attack type ratio, top rule, daily trend, and resolution metrics.

Admin features include team management, workspace listing, sensor key retrieval and rotation, protected site configuration, detection profile control, and custom detection rules. Detection rules can be written as simple contains/regex rules for bridge-level matching or as Snort rules, which are written into generated rule files and trigger Snort reload behavior.

Defense features include IP blacklist persistence, Redis synchronization, and generated Nginx deny rules. In the current branch, blacklist behavior exists as a demo reverse-proxy defense mechanism; it affects traffic as seen by the Nginx gateway rather than acting as a full host firewall.

The email subsystem supports registration emails, settings confirmation emails, and severity-based alert emails. Email failures are intentionally non-blocking for registration and worker processing. For example, if SMTP credentials are wrong, account creation still succeeds, while the response can indicate that the confirmation email was not sent.

Configuration is controlled primarily through the root `.env` file in Docker Compose. The backend also supports local fallback `.env` loading for non-Docker development. SQL query spam is disabled by default through `SQLALCHEMY_ECHO=false`, and the backend uses an `ids_platform` logger for application-level logs.

[Insert Screenshot 5: Backend API documentation / FastAPI Swagger page]

## 5. Database Design and Data Model

PostgreSQL is used as the persistent data store because IDS alerts and analyst decisions need durable history. Redis is used for short-lived queueing and real-time communication, while PostgreSQL stores the evidence trail needed for later investigation, reporting, and dashboard analytics.

The backend uses SQLAlchemy's asynchronous ORM layer to define models and interact with the database [9]. The main database models are defined in `models.py`.

[Insert Screenshot 6: Database ERD showing Workspace, User, Alert, DetectionRule, BlacklistedIP, and MonitoredWebsite relationships]

`Workspace` represents the tenant or operational boundary. It stores the workspace name, sensor API key, detection profile, and creation timestamp. One workspace owns many users, alerts, notifications, blacklisted IPs, monitored websites, and detection rules.

`User` represents the analyst or administrator. It stores email, hashed password, full name, role, active state, workspace relation, alert email, notification toggle, minimum severity threshold, and creation timestamp. This connects identity and notification preference management to the security workflow.

`Alert` is the core IDS event record. It stores the attack type, severity, source and destination IPs, ports, protocol, action, status, notes, payload preview, raw request, signature message, signature class, SID/GID, event ID, capture metadata, timestamp, workspace ID, flagged state, and saved state. This model is the center of the analysis platform because it combines network evidence, IDS signature data, and analyst triage state.

`Notification` stores dashboard/system notifications. It allows the system to keep user-facing security or operational messages associated with a workspace.

`BlacklistedIP` stores analyst-created IP block entries. Each record contains the IP address, reason, creator, timestamp, and workspace relation. The backend can synchronize this database state into Nginx deny-rule configuration.

`MonitoredWebsite` stores protected origin configuration. It includes domain, target IP, target port, scheme, public hostname, listen port, TLS mode, proxy mode, health path, active state, and workspace relation. These records are used to generate Nginx reverse-proxy server blocks.

`DetectionRule` stores custom workspace-owned detection logic. A rule has a title, severity, category, match type, pattern, enabled state, creation timestamp, and workspace relation. These records support both bridge-level custom matching and Snort custom rule output.

This database design separates durable state from streaming state. PostgreSQL answers historical and analytical questions, while Redis supports event flow between ingestion, processing, and live frontend updates.

## 6. Frontend Analysis Platform

The frontend is not only a visual layer; it is the analyst-facing analysis platform. It is implemented with React and TypeScript, bundled by Vite, and organized around protected dashboard routes and public authentication routes.

React Router separates public pages such as login, registration, and onboarding from protected dashboard pages. The protected route checks authentication state from the Zustand auth store. This means the frontend keeps a persisted session in `wids-auth-storage`, allowing users to remain logged in across reloads.

React Query is used for API fetching, caching, refetch intervals, and error handling. This is important in an IDS dashboard because metrics and alerts need regular refreshes even when no WebSocket event is received. For example, the Overview page refetches dashboard statistics frequently, while the Intrusions page refetches alert lists.

Zustand is used for lightweight application state. The auth store persists the JWT token and user data. The alerts store tracks filters, selected alert state, real-time alert history, and WebSocket connection state.

The WebSocket hook connects to `VITE_WS_URL`, sends the JWT token as an authentication message, listens for alert events, sends heartbeat pings, and shows toast notifications for high and critical alerts. This gives the frontend a live monitoring behavior rather than a purely request/response model.

Recharts is used for visualization. The platform displays hourly alert trends, daily rhythm, attack type distribution, severity distribution, protocol distribution, and success metrics. These charts turn raw IDS alerts into operational security information.

The frontend also includes loading, empty, and error states. This is important for professional dashboard behavior: empty telemetry should not look broken, loading states should not shift the layout excessively, and authentication/backend errors should be visible to the analyst.

## 7. Frontend Screens and Analyst Workflows

The Overview screen functions as the operational command view. It shows live traffic volume, active threats, secured segments, daily alert rhythm, daily success metrics, attack mix, last mitigation, and a live alert stream. This page answers the first SOC question: "Is the system currently under attack?"

[Insert Screenshot 7: Overview dashboard with live metrics]

The Intrusions screen is the main investigation table. It supports searching, filtering by status and severity, date filtering, pagination, and alert detail inspection. The detail modal shows why the alert fired, the signature metadata, the rule source when available, flow information, event capture metadata, packet filter, raw request, analyst notes, and triage actions. This page answers the second SOC question: "What happened, how severe is it, and what should be done next?"

[Insert Screenshot 8: Intrusions table with filters]

[Insert Screenshot 9: Alert detail modal showing raw request, signature metadata, and triage controls]

The Intelligence screen provides historical and statistical analysis. It supports weekly and monthly views, period volume, unique attackers, top triggered rule, resolution rate, alert trend, success metrics, attack type ratio, top attackers, protocol distribution, and severity distribution. This page helps analysts identify patterns rather than individual alerts.

[Insert Screenshot 10: Intelligence page with trend, severity, protocol, and attack type charts]

The Defense screen supports IP blacklist workflows. It allows analysts to persist suspicious IPs as defense entries. In the current architecture, this is a gateway-level reverse-proxy block model.

The Detection Rules screen allows custom detection logic to be managed from the UI. This is important because IDS systems require tuning: rules must be added, enabled, disabled, or refined as the monitored application and threat model evolve.

[Insert Screenshot 11: Detection Rules page]

The Management screen supports workspace and protected site administration. Protected site records are used to generate Nginx configuration, which connects application-level management with gateway runtime behavior.

The Settings screen controls alert email delivery, notification enablement, minimum severity threshold, confirmation email testing, and dashboard theme. This makes the notification system configurable by the analyst instead of hardcoded.

[Insert Screenshot 12: Settings page showing email notification configuration]

Notifications and Profile provide supporting workflows: user-facing system messages and personal account information.

## 8. Testing and Quality Assurance

The current branch was verified with backend and frontend checks.

Backend Python compilation passed with:

```text
python -m compileall -q backend
```

Backend tests were executed inside Docker because the local Python environment did not have `pytest` installed. The Docker test run passed:

```text
docker compose run --rm backend pytest
```

Result: `20 passed`.

[Insert Screenshot 13: Backend pytest result]

Frontend linting passed:

```text
npm.cmd run lint
```

Frontend unit/component tests passed:

```text
npm.cmd run test
```

Result: `5 test files`, `6 tests passed`.

Frontend production build passed:

```text
npm.cmd run build
```

The build completed successfully, but Vite reported a chunk-size warning because the generated JavaScript bundle is larger than 500 kB. This is not a functional failure, but it suggests that production optimization could benefit from code-splitting.

[Insert Screenshot 14: Frontend Vitest/lint/build terminal results]

The backend test suite covers alert contract serialization, analytics helpers, bridge payload extraction, blacklist config generation, mailer behavior, registration email failure handling, and worker email threshold behavior. The frontend tests cover registration password validation, alert title utilities, Overview empty telemetry rendering, Intelligence empty chart states, and Settings confirmation email workflow.

## 9. Limitations and Future Work

The current platform is strong as a local IDS demo and thesis implementation, but it is not yet a production deployment.

First, the blacklist feature is implemented at the Nginx reverse-proxy level. It demonstrates real gateway blocking behavior, but it does not block all traffic at the host firewall, container network, or kernel level.

Second, WebSocket authentication is functional, but stale JWT tokens can create reconnect loops. A future improvement would be to detect `1008` policy closes on the frontend and force logout or token refresh instead of retrying indefinitely.

Third, the backend test suite passes, but overall coverage is limited because many FastAPI routers are not covered by full integration tests. Future work should add authenticated API tests for alert filtering, admin protected sites, detection rules, settings, WebSocket failure cases, and workspace isolation.

Fourth, the backend shows Pydantic v2 deprecation warnings for class-based model config. These warnings do not break the application now, but they should be cleaned up before long-term maintenance.

Fifth, the frontend build passes but reports a large JavaScript chunk. The dashboard could be improved with route-level dynamic imports, lazy-loaded chart modules, and production bundle analysis.

Finally, SMTP mail delivery depends on real provider credentials and provider-specific security requirements, such as app passwords for Gmail. The current code handles failure gracefully, but production usage should include explicit SMTP validation, observability, and operational documentation.

## 10. References

[1] NIST, "Guide to Intrusion Detection and Prevention Systems (IDPS)," NIST SP 800-94. https://csrc.nist.gov/pubs/sp/800/94/final

[2] OWASP Foundation, "OWASP Top Ten Web Application Security Risks." https://owasp.org/www-project-top-ten/

[3] Snort, "Snort 3 Rule Writing Guide." https://docs.snort.org/

[4] Nginx, "ngx_http_proxy_module." https://nginx.org/en/docs/http/ngx_http_proxy_module.html

[5] Docker, "Docker Compose Documentation." https://docs.docker.com/compose/

[6] FastAPI, "FastAPI Documentation." https://fastapi.tiangolo.com/

[7] PostgreSQL Global Development Group, "PostgreSQL Documentation." https://www.postgresql.org/docs/

[8] Redis, "Redis Streams Documentation." https://redis.io/docs/latest/develop/data-types/streams/

[9] SQLAlchemy, "SQLAlchemy 2.0 Documentation." https://docs.sqlalchemy.org/en/20/

[10] React, "React Documentation." https://react.dev/

[11] Vite, "Vite Guide." https://vite.dev/guide/

[12] Vitest, "Vitest Guide." https://vitest.dev/guide/

[13] Testing Library, "React Testing Library Introduction." https://testing-library.com/docs/react-testing-library/intro/

[14] Project source code, `ids-health-mail-tests-analytics` branch: `README.md`, `docker-compose.yml`, `backend/src`, `backend/snort_bridge.py`, and `frontend/src`.

---

# Project Structure and File Responsibility Report

## 1. Overview

The W-IDS platform is organized as a multi-service intrusion detection and analysis system. Its structure separates detection, ingestion, persistence, backend APIs, frontend visualization, and runtime infrastructure. At a high level, the project is divided into five major layers:

```text
ids-platform/
├── backend/          FastAPI API, database models, worker, bridge, tests
├── frontend/         React + TypeScript SOC dashboard
├── nginx/            Reverse-proxy gateway configuration
├── snort/            Snort 3 configuration, local rules, official rules, logs
├── demo-origin/      Protected demo web application
├── docker-compose.yml
├── Dockerfile.snort
├── README.md
└── .env / .env.example
```

The files are connected through the runtime pipeline: Nginx receives protected web traffic, Snort inspects that traffic, `snort_bridge.py` converts IDS events into API payloads, the backend queues them in Redis, the worker persists them into PostgreSQL, and the React frontend displays them for investigation.

## 2. Root-Level Files

```text
ids-platform/
├── docker-compose.yml
├── Dockerfile.snort
├── README.md
├── .env
├── .env.example
├── .gitignore
├── .gitattributes
└── main.py
```

| File | Purpose | Connection |
|---|---|---|
| `docker-compose.yml` | Defines the full local platform: backend, worker, PostgreSQL, Redis, Nginx gateway, Snort engine, snort bridge, and demo origin. | This is the central runtime orchestrator. |
| `Dockerfile.snort` | Builds the Snort 3 container image, including DAQ, Snort 3, tcpdump, and runtime networking tools. | Used by the `secure-engine` service. |
| `README.md` | Documents services, environment setup, demo login, IDS testing commands, and runtime flow. | Main operational guide for the project. |
| `.env` | Runtime configuration used by Docker Compose. | Supplies database URL, API keys, SMTP settings, Redis config, frontend URL, and secrets. |
| `.env.example` | Template for recreating `.env`. | Used for setup and documentation. |
| `.gitignore` | Prevents committing local/generated files. | Protects secrets, caches, logs, builds, and local artifacts. |
| `.gitattributes` | Git behavior configuration. | Supports consistent repository handling. |
| `main.py` | Small root-level Python entry file; not part of the active Docker pipeline. | The real backend entrypoint is `backend/src/main.py`. |

## 3. Backend Structure

```text
backend/
├── Dockerfile
├── requirements.txt
├── start.sh
├── config.py
├── sensor_simulator.py
├── seed_workspace.py
├── snort_bridge.py
├── snort_reader.py
├── pytest.ini
├── alembic/
├── tests/
└── src/
```

The backend is the control and processing layer of the system. It exposes APIs, validates users and sensors, queues IDS alerts, persists processed events, sends email notifications, and broadcasts live alerts.

| File | Purpose | Connection |
|---|---|---|
| `backend/Dockerfile` | Builds the Python backend image. | Shared by `backend`, `worker`, and `snort-bridge` services. |
| `requirements.txt` | Lists Python dependencies such as FastAPI, SQLAlchemy, Redis, asyncpg, fastapi-mail, pytest. | Defines backend runtime and test environment. |
| `start.sh` | Backend container startup script. | Runs migrations/seeding before serving API. |
| `config.py` | Loads environment settings using Pydantic settings. | Used by database, auth, Redis, email, and logging configuration. |
| `sensor_simulator.py` | Generates sample alert payloads for testing/demo. | Used by tests and simulation workflows. |
| `seed_workspace.py` | Seeds demo workspace, user, sensor key, and protected site data. | Ensures the local demo starts with usable data. |
| `snort_bridge.py` | Reads Snort JSON alerts, extracts request/capture metadata, normalizes events, posts to `/alerts/ingest`. | Connects the IDS engine to the backend alert pipeline. |
| `snort_reader.py` | Legacy alert reader. | Documented as unused by the current Compose pipeline. |
| `pytest.ini` | Backend test configuration. | Controls pytest discovery and coverage behavior. |

## 4. Backend Application Files

```text
backend/src/
├── main.py
├── database.py
├── models.py
├── schemas.py
├── analytics.py
├── worker.py
├── core/
└── api/
```

| File | Purpose | Connection |
|---|---|---|
| `src/main.py` | Creates the FastAPI app, configures CORS, includes routers, starts/stops realtime broadcaster. | Backend API entrypoint. |
| `src/database.py` | Creates async SQLAlchemy engine and session dependency. | Used by all API routes and worker database operations. |
| `src/models.py` | Defines database tables: `Workspace`, `User`, `Alert`, `Notification`, `BlacklistedIP`, `MonitoredWebsite`, `DetectionRule`. | Core PostgreSQL data model. |
| `src/schemas.py` | Defines Pydantic request/response contracts and alert serialization helpers. | Shapes API payloads and WebSocket alert contracts. |
| `src/analytics.py` | Contains reusable analytics helpers: ratios, "Other" grouping, success metrics. | Used by alert statistics endpoints. |
| `src/worker.py` | Consumes Redis alert stream, writes alerts to PostgreSQL, publishes WebSocket events, sends alert emails. | Bridges queued IDS events to durable storage and live frontend updates. |

## 5. Backend Core Modules

```text
backend/src/core/
├── logger.py
├── mailer.py
├── queue.py
├── realtime.py
├── security.py
└── ws_manager.py
```

| File | Purpose | Connection |
|---|---|---|
| `logger.py` | Configures the `ids_platform` logger and file/console handlers. | Used across backend and worker for operational logs. |
| `mailer.py` | Builds SMTP mailer, sends registration, confirmation, and security alert emails. | Used by auth, settings, and worker. |
| `queue.py` | Creates Redis client, writes alerts to Redis Streams, publishes WebSocket events. | Connects ingest, worker, and realtime broadcaster. |
| `realtime.py` | Subscribes to Redis Pub/Sub and forwards alert events to WebSocket clients. | Runs during FastAPI app lifecycle. |
| `security.py` | Handles password hashing, JWT creation, and authenticated user lookup. | Used by protected backend routes. |
| `ws_manager.py` | Tracks active WebSocket connections per workspace and broadcasts messages. | Used by WebSocket endpoint and realtime broadcaster. |

## 6. Backend API Routers

```text
backend/src/api/
├── auth.py
├── users.py
├── admin.py
├── defense.py
├── ws.py
└── alerts/
    ├── ingest.py
    ├── management.py
    └── stats.py
```

| File | Purpose | Connection |
|---|---|---|
| `auth.py` | Registration, login, onboarding, profile, password changes, sensor workspace/key helper logic. | Creates users and JWT tokens. |
| `users.py` | User settings, notification preferences, test email sending, dashboard notifications. | Connects user preferences to email delivery. |
| `admin.py` | Admin/team features, protected sites, sensor key rotation, detection profiles, custom rules, Nginx config generation. | Connects UI management actions to runtime gateway/Snort outputs. |
| `defense.py` | Blacklist CRUD, Redis blacklist sync, generated Nginx deny file. | Supports reverse-proxy-level blocking. |
| `ws.py` | WebSocket endpoint with JWT authentication. | Delivers live alert events to authenticated workspace users. |
| `alerts/ingest.py` | Sensor ingestion endpoint with API key validation and Redis rate limiting. | Entry point for `snort_bridge.py`. |
| `alerts/management.py` | Alert listing, filtering, detail lookup, triage updates, rule lookup, raw request hydration. | Main Intrusions page backend. |
| `alerts/stats.py` | Dashboard and intelligence analytics endpoints. | Feeds Overview and Intelligence charts. |

## 7. Database and Migration Files

```text
backend/alembic/
├── env.py
├── script.py.mako
├── README
└── versions/*.py
```

Alembic manages schema evolution. The migration files add and adjust SaaS/workspace structures, blacklist tables, alert flags, raw request fields, monitored websites, detection rules, signature metadata, and runtime compatibility fixes.

The database model is connected as follows:

```text
Workspace
├── Users
├── Alerts
├── Notifications
├── BlacklistedIPs
├── MonitoredWebsites
└── DetectionRules
```

PostgreSQL stores durable investigation state. Redis is intentionally separate and used for queueing, rate limiting, blacklist cache operations, and real-time message distribution.

## 8. Backend Tests

```text
backend/tests/
├── test_alert_contract.py
├── test_analytics.py
├── test_bridge_payload.py
├── test_defense_blacklist.py
├── test_mailer.py
├── test_registration_email.py
├── test_worker_email.py
└── docker_compose_smoke.ps1
```

These tests verify alert serialization, analytics formulas, raw request extraction, blacklist config generation, SMTP fallback behavior, registration email failure safety, and worker email threshold logic. The branch currently passes `20` backend tests in Docker.

## 9. Frontend Structure

```text
frontend/
├── package.json
├── vite.config.ts
├── index.html
├── eslint.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig*.json
├── public/
└── src/
```

| File | Purpose | Connection |
|---|---|---|
| `package.json` | Defines frontend dependencies and scripts: dev, build, lint, test. | Main frontend project manifest. |
| `vite.config.ts` | Vite build/test configuration. | Connects React app to dev/build/test tooling. |
| `index.html` | Browser HTML entrypoint. | Loads React bundle. |
| `eslint.config.js` | Frontend lint rules. | Used by `npm run lint`. |
| `tailwind.config.js` | Tailwind styling configuration. | Supports dashboard styling. |
| `postcss.config.js` | PostCSS setup. | Used by Tailwind/CSS build. |
| `tsconfig*.json` | TypeScript compiler configuration. | Used by build and editor tooling. |
| `public/*` | Static image/brand assets. | Used by UI branding and public layout. |

## 10. Frontend Source Files

```text
frontend/src/
├── main.tsx
├── App.tsx
├── index.css
├── App.css
├── api/
├── stores/
├── hooks/
├── utils/
├── types/
├── components/
├── pages/
└── test/
```

| File | Purpose | Connection |
|---|---|---|
| `main.tsx` | React root render file. | Mounts `App` into `index.html`. |
| `App.tsx` | Defines router, protected routes, layouts, pages, React Query provider, toaster. | Main frontend composition root. |
| `index.css` | Global styles and Tailwind layers. | Applies visual design system. |
| `App.css` | App-specific CSS. | Supports UI styling. |
| `api/client.ts` | Axios client and API base configuration. | Shared by all API endpoint modules. |
| `api/endpoints/alerts.ts` | Alert list, detail, triage, stats, intelligence API calls. | Used by Overview, Intrusions, Intelligence. |
| `api/endpoints/settings.ts` | User settings and confirmation email API calls. | Used by Settings page. |
| `stores/auth.store.ts` | Persisted authentication state with token and user. | Powers protected routing and WebSocket auth. |
| `stores/alerts.store.ts` | Alert filters, real-time alerts, selected alert, WebSocket state. | Used by Overview and Intrusions. |
| `stores/ui.store.ts` | Theme state. | Used by layout and Settings. |
| `hooks/useWebSocket.ts` | WebSocket connection, auth message, heartbeat, reconnect, live alert toasts. | Connects worker/realtime backend to UI. |
| `utils/alertTitles.ts` | Frontend alert title normalization. | Keeps alert display readable. |
| `types/index.ts` | TypeScript interfaces for alerts, stats, settings, WebSocket messages. | Shared frontend type contract. |
| `test/render.tsx` | Test helper for rendering components with providers/router. | Used by frontend tests. |
| `test/setup.tsx` | Vitest/RTL test setup. | Adds test environment behavior. |

## 11. Frontend Components and Pages

```text
components/
├── layout/AppLayout.tsx
├── layout/PublicLayout.tsx
└── ui/Button.tsx, Card.tsx, Input.tsx, Modal.tsx, Skeleton.tsx

pages/
├── auth/Login.tsx
├── auth/Register.tsx
├── auth/Onboarding.tsx
└── dashboard/
    ├── Overview.tsx
    ├── Intrusions.tsx
    ├── Intelligence.tsx
    ├── Defense.tsx
    ├── DetectionRules.tsx
    ├── Management.tsx
    ├── Settings.tsx
    ├── Notifications.tsx
    └── Profile.tsx
```

`AppLayout.tsx` provides the authenticated dashboard shell. `PublicLayout.tsx` wraps login, registration, and onboarding.

The dashboard pages map directly to analyst workflows. `Overview` shows live status and daily alert rhythm. `Intrusions` supports investigation and triage. `Intelligence` provides trend and distribution analysis. `Defense` supports IP blocking. `DetectionRules` supports rule management. `Management` controls protected sites and workspace-related features. `Settings` manages email delivery and theme. `Notifications` and `Profile` support user-level operations.

## 12. Nginx Structure

```text
nginx/
├── nginx.conf
├── reload-watch.sh
├── generated/
├── logs/
└── certs/
```

| File/Directory | Purpose | Connection |
|---|---|---|
| `nginx.conf` | Main Nginx config; includes generated site/block files and proxies default traffic to backend. | Runtime gateway entrypoint. |
| `reload-watch.sh` | Watches generated configs, validates with `nginx -t`, reloads Nginx. | Applies backend-generated gateway changes. |
| `generated/` | Contains generated protected-site and blocked-IP config files. | Written by backend admin/defense logic. |
| `logs/` | Nginx access/error logs. | Can be used by bridge fallback and troubleshooting. |
| `certs/` | TLS certificate mount location. | Used when protected sites have active edge TLS. |

## 13. Snort Structure

```text
snort/
├── etc/
│   ├── snort.lua
│   ├── snort_defaults.lua
│   ├── file_magic.lua
│   └── start-snort.sh
├── rules/
│   ├── local/local.rules
│   ├── local/workspace.rules
│   └── official/
├── builtins/
├── so_rules/
└── logs/
```

| File/Directory | Purpose | Connection |
|---|---|---|
| `etc/snort.lua` | Main Snort configuration. | Defines HOME_NET, EXTERNAL_NET, inspection modules, rule profile include. |
| `etc/start-snort.sh` | Runtime launcher for Snort; builds selected profile includes and reloads on request. | Used by `secure-engine`. |
| `rules/local/local.rules` | Local fallback/demo signatures. | Detects common web attack probes in the lab. |
| `rules/local/workspace.rules` | Generated/custom workspace Snort rules. | Written by backend custom rule workflow. |
| `rules/official/` | Official Snort rule assets. | Included by selected detection profiles. |
| `builtins/` | Built-in Snort rule assets. | Used by Snort runtime. |
| `so_rules/` | Shared object/precompiled Snort rule assets. | External rule engine assets. |
| `logs/` | Alert logs, sensor key, detection profile, capture files. | Read by `snort_bridge.py` and Snort launcher. |

## 14. Demo Origin

```text
demo-origin/
└── index.html
```

The demo origin is the protected upstream website. Nginx proxies `app.example.com` traffic to this service. The IDS does not need the origin to be vulnerable; suspicious request patterns are enough to trigger Snort or fallback detection rules.

## 15. How The Files Connect End-to-End

```text
curl/browser request
    ↓
nginx/nginx.conf + generated protected site config
    ↓
demo-origin/index.html
    ↓
Snort observes gateway namespace
    ↓
snort/etc/snort.lua + snort/rules/local/*.rules + official rules
    ↓
snort/logs/alert_json.txt
    ↓
backend/snort_bridge.py
    ↓
backend/src/api/alerts/ingest.py
    ↓
backend/src/core/queue.py → Redis Stream
    ↓
backend/src/worker.py
    ↓
backend/src/models.py → PostgreSQL alerts table
    ↓
backend/src/core/realtime.py + ws_manager.py
    ↓
frontend/src/hooks/useWebSocket.ts
    ↓
Overview / Intrusions / Intelligence pages
```

This structure shows that each directory has a distinct responsibility. Nginx controls gateway traffic, Snort detects suspicious patterns, the bridge normalizes sensor output, the backend validates and processes alerts, PostgreSQL stores durable investigation data, Redis coordinates asynchronous and real-time movement, and the frontend converts that backend state into analyst workflows.

## 16. Sources

[1] Project source code, `ids-health-mail-tests-analytics` branch.

[2] NIST, "Guide to Intrusion Detection and Prevention Systems (IDPS)," NIST SP 800-94.

[3] Docker Compose Documentation: https://docs.docker.com/compose/

[4] FastAPI Documentation: https://fastapi.tiangolo.com/

[5] PostgreSQL Documentation: https://www.postgresql.org/docs/

[6] Redis Streams Documentation: https://redis.io/docs/latest/develop/data-types/streams/

[7] Snort 3 Rule Writing Guide: https://docs.snort.org/

[8] Nginx proxy module documentation: https://nginx.org/en/docs/http/ngx_http_proxy_module.html

[9] React Documentation: https://react.dev/
