from fastapi import FastAPI
from src.database import engine, Base
from src import models
from src.api import alerts , stats #, config
from src.core.logger import logger

app = FastAPI(title="W-IDS Platform")

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
