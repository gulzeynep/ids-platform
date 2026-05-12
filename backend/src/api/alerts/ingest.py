from fastapi import APIRouter, Depends, Header, status, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.database import get_db
from src.models import Workspace
from src.schemas import AlertCreate
from src.core.queue import add_to_queue, redis_client

router = APIRouter()

async def verify_api_key(
        request: Request, 
        x_api_key: str = Header(None), 
        db: AsyncSession = Depends(get_db)
):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Security Key is missing.")

    #confirm workspace
    result = await db.execute(select(Workspace).where(Workspace.api_key == x_api_key))
    workspace = result.scalars().first()
    if not workspace: 
        raise HTTPException(status_code=401, detail="Invalid Security Key.")

    # REDIS RATE LIMITING ( max 10 request a second, 600 a minute)
    rate_limit_key = f"rate_limit:workspace:{workspace.id}"
    request_count = await redis_client.incr(rate_limit_key)
    if request_count == 1: # first request
        await redis_client.expire(rate_limit_key, 60) 
    if request_count > 600: # 600 request a minute
        raise HTTPException(status_code=429, detail="Rate Limit Exceeded. Sensor is sending too many requests.")

    return workspace

# sensor ingestion 
@router.post("/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_alert(
    request: Request,
    alert_in: AlertCreate, 
    workspace: Workspace = Depends(verify_api_key)
):
    #prep the data and put it to redis queue instead of db 
    payload = alert_in.model_dump()
    payload["workspace_id"] = workspace.id
    payload["status"] = "new"
    
    await add_to_queue(payload) 
    
    return {"status": "Threat queued for processing"}
