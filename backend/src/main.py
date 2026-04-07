from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import auth, alerts, admin, analytics, ws, users

app = FastAPI(title="W-IDS Core API", description="Siber Güvenlik Operasyon Merkezi API")

# GÜVENLİK (CORS) İZİNLERİ (React'in bağlanabilmesi için şart)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Geliştirme ortamı için her yere açık
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TÜM YOLLARI (ENDPOINTLERİ) ANA ŞALTERE BAĞLIYORUZ
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(analytics.router) 
app.include_router(ws.router, tags=["WebSockets"])        
app.include_router(users.router, prefix="/management", tags=["Management"])

@app.get("/")
async def root():
    return {"message": "W-IDS Core API is running. Systems online."}