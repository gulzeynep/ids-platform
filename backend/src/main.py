from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.src.api import auth, alerts, admin, analytics
from backend.src.database import engine, Base
from backend.src.core.logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("--- W-IDS Platform Starting Up ---")
    try:
        async with engine.begin() as conn:
            from backend.src.models import Base, User, Alert, Company 
            await conn.run_sync(Base.metadata.create_all)
        logger.info(" Database tables checked/created successfully.")
    except Exception as e:
        logger.error(f" Error starting up the database: {e}")
    
    yield 
    
    logger.info("--- W-IDS Platform Shutting Down ---")

app = FastAPI(title="W-IDS Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  
        "http://127.0.0.1:5173",
        "http://localhost:3001"  
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router) 
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"status": "W-IDS Online", "message": "Command Center Ready"}