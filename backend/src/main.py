from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# YENİ VE ESKİ TÜM ROTALARI İÇERİ AKTARIYORUZ
from backend.src.api import auth, alerts, admin, analytics, ws, users

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
app.include_router(auth.router)
app.include_router(alerts.router)
app.include_router(admin.router)
app.include_router(analytics.router) 
app.include_router(ws.router)        
app.include_router(users.router)

@app.get("/")
async def root():
    return {"message": "W-IDS Core API is running. Systems online."}