from fastapi import FastAPI
from .api.alerts import ingest, management, security as alert_security
from .api.analytics import dashboard
from .api import auth, admin, users

app = FastAPI(title="W-IDS Platform")

# Routes
app.include_router(auth.router, prefix="/auth")
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(ingest.router)        # /alerts/ingest
app.include_router(management.router)    # /alerts (GET, PATCH)
app.include_router(alert_security.router) # /security/blacklist
app.include_router(dashboard.router)     # /analytics/overview

@app.get("/")
async def root():
    return {"status": "W-IDS Core Online"}