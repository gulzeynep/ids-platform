from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.alerts import ingest, management, stats, security as alert_security
from .api.analytics import dashboard
from .api import auth, admin, users

app = FastAPI(title="W-IDS Platform")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Tüm metodlara izin ver (GET, POST, OPTIONS vb.)
    allow_headers=["*"], # Tüm header'lara izin ver
)

# Routes
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(ingest.router)        # /alerts/ingest
app.include_router(management.router)    # /alerts (GET, PATCH)
app.include_router(stats.router)         # /alerts/stats/overview
app.include_router(alert_security.router) # /security/blacklist
app.include_router(dashboard.router)     # /analytics/overview

@app.get("/")
async def root():
    return {"status": "W-IDS Core Online"}