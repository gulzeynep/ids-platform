from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api import auth, alerts, admin, ws, users, defense
from src.api.auth import limiter

app = FastAPI(title="W-IDS Core")
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True, #origins = * and credentials = true cant be used at the same time
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(alerts.router)
app.include_router(admin.router)
app.include_router(ws.router)
app.include_router(users.router )
app.include_router(defense.router )