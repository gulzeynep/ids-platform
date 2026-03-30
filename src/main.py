from fastapi import FastAPI
from src.database import engine, Base
from src.api import alerts #, stats, config

app = FastAPI(title="W-IDS Platform")

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(alerts.router)
#app.include_router(stats.router)
#app.include_router(config.router)


@app.get("/")
async def root():
    return {"status": "Online"}
