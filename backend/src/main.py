from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.src.api import alerts
from backend.src.database import engine, Base
from backend.src import models
from backend.src.api import stats #, config
from backend.src.core.logger import logger

app = FastAPI(title="W-IDS Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Frontend adresi
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    logger.info("Starting up the W-IDS Platform...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables checked/created successfully.")
    except Exception as e:
        logger.error(f"Error starting up the database: {e}")

app.include_router(alerts.router)
app.include_router(stats.router)
#app.include_router(config.router)


@app.get("/")
async def root():
    logger.info("Root endpoint accessed.")
    return {"status": "W-IDS Online"}
