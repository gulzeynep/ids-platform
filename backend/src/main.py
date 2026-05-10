from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api import auth, alerts, admin, ws, users, defense, websites

app = FastAPI(title="W-IDS Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(alerts.router)
app.include_router(admin.router)
app.include_router(ws.router)
app.include_router(users.router)
app.include_router(defense.router)
app.include_router(websites.router)