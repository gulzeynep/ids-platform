from fastapi import FastAPI
from src.database import engine, Base
from src.api.alerts import router as alerts_router 

app = FastAPI(title="W-IDS Platform")

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(alerts_router)

@app.get("/")
async def root():
    return {"status": "Online"}
