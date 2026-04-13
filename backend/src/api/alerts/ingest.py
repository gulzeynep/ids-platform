from fastapi import APIRouter, Depends, Header, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...database import get_db
from ...models import Alert, Workspace, BlacklistedIP
from ...schemas import AlertCreate
from ..ws import manager
from ...core.redis import get_redis

router = APIRouter(prefix="/alerts", tags=["Sensor Ingestion"])

async def verify_api_key(x_api_key: str = Header(None), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.api_key == x_api_key))
    workspace = result.scalars().first()
    if not workspace: 
        raise HTTPException(status_code=401, detail="Invalid Security Key.")
    return workspace

@router.post("/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_alert(
    alert_in: AlertCreate, 
    db: AsyncSession = Depends(get_db), 
    redis = Depends(get_redis),
    workspace: Workspace = Depends(verify_api_key)
):
    # REDIS KONTROLÜ (Blacklist Kontrolü)
    redis_key = f"blacklist:{workspace.id}"
    is_banned = await redis.sismember(redis_key, alert_in.source_ip)

    # Veriyi kaydet (Banlıysa 'blocked' olarak işaretle)
    action_taken = "blocked" if is_banned else "logged"
    new_alert = Alert(**alert_in.dict(), workspace_id=workspace.id, action=action_taken)
    
    db.add(new_alert)
    await db.commit()
    
    # Dashboard'a anlık bildir (Sadece banlı olmayanları veya hepsini tercihine göre)
    await manager.broadcast_to_workspace(
        {"event": "NEW_THREAT", "data": alert_in.dict(), "blocked": bool(is_banned)}, 
        workspace.id
    )
    
    if is_banned:
        return {"status": "Automated Defense: IP Banned"}
    return {"status": "Threat logged and broadcasted"}