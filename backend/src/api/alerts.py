from fastapi import APIRouter, Depends, Header, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ..database import get_db
from ..models import Alert, User, Workspace
from ..schemas import AlertCreate, AlertResponse
from .auth import get_current_user
from .ws import manager

router = APIRouter()

async def verify_api_key(x_api_key: str = Header(None), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.api_key == x_api_key))
    ws = result.scalars().first()
    if not ws: raise HTTPException(status_code=401, detail="Invalid API Key")
    return ws

@router.post("/ingest", status_code=201)
async def ingest_alert(alert_in: AlertCreate, db: AsyncSession = Depends(get_db), ws: Workspace = Depends(verify_api_key)):
    new_alert = Alert(**alert_in.dict(), workspace_id=ws.id)
    db.add(new_alert)
    await db.commit()
    await manager.broadcast_to_workspace({"event": "NEW_ALERT", "data": alert_in.dict()}, ws.id)
    return {"status": "logged"}

@router.get("/", response_model=List[AlertResponse])
async def get_alerts(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Alert).where(Alert.workspace_id == current_user.workspace_id).order_by(Alert.timestamp.desc()))
    return result.scalars().all()