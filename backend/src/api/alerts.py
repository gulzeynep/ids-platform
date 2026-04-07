from fastapi import APIRouter, Depends, Header, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ..database import get_db
from ..models import Alert, User, Workspace
from ..schemas import AlertCreate, AlertResponse, AlertUpdateStatus
from .auth import get_current_user
from .ws import manager

router = APIRouter(prefix="/alerts", tags=["Alerts"])

async def verify_api_key(x_api_key: str = Header(None), db: AsyncSession = Depends(get_db)):
    """Verifies the sensor using the unique X-API-Key header."""
    result = await db.execute(select(Workspace).where(Workspace.api_key == x_api_key))
    workspace = result.scalars().first()
    if not workspace: 
        raise HTTPException(status_code=401, detail="Invalid Security Key.")
    return workspace

@router.post("/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_alert(
    alert_in: AlertCreate, 
    db: AsyncSession = Depends(get_db), 
    workspace: Workspace = Depends(verify_api_key)
):
    """Endpoint for sensors to log new threats."""
    new_alert = Alert(**alert_in.dict(), workspace_id=workspace.id)
    db.add(new_alert)
    await db.commit()
    
    # Push real-time update to the React dashboard via WebSocket
    await manager.broadcast_to_workspace(
        {"event": "NEW_THREAT_DETECTED", "data": alert_in.dict()}, 
        workspace.id
    )
    return {"status": "Threat logged and broadcasted"}

@router.get("/", response_model=List[AlertResponse])
async def get_workspace_alerts(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetch all alerts belonging to the user's workspace."""
    result = await db.execute(
        select(Alert)
        .where(Alert.workspace_id == current_user.workspace_id)
        .order_by(Alert.timestamp.desc())
    )
    return result.scalars().all()

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert_detail(
    alert_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetch full intelligence details for a specific alert (for the Detail Popup)."""
    result = await db.execute(
        select(Alert).where(
            Alert.id == alert_id, 
            Alert.workspace_id == current_user.workspace_id
        )
    )
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Intelligence record not found.")
    return alert

@router.patch("/{alert_id}/triage")
async def update_alert_triage(
    alert_id: int, 
    triage_data: AlertUpdateStatus, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allows analysts to update threat status and add investigation notes."""
    result = await db.execute(
        select(Alert).where(
            Alert.id == alert_id,
            Alert.workspace_id == current_user.workspace_id
        )
    )
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert record not found.")
    
    alert.status = triage_data.status
    if hasattr(triage_data, 'notes') and triage_data.notes:
        alert.notes = triage_data.notes
        
    await db.commit()
    return {"message": "Triage data updated successfully."}