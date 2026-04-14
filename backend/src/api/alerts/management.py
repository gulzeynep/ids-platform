from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime

from ...database import get_db
from ...models import Alert, User
from ...schemas import AlertResponse, AlertUpdateStatus
from ..auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[AlertResponse])
async def get_workspace_alerts(
    status: Optional[str] = "new",
    severity: Optional[str] = "all",
    is_saved: Optional[bool] = None,
    is_flagged: Optional[bool] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetch and filter alerts for the Intrusions Datatable."""
    query = select(Alert).where(Alert.workspace_id == current_user.workspace_id)
    
    if status and status != "all":
        query = query.where(Alert.status == status)
    if severity and severity != "all":
        query = query.where(Alert.severity == severity)
    if is_saved is not None:
        query = query.where(Alert.is_saved == is_saved)
    if is_flagged is not None:
        query = query.where(Alert.is_flagged == is_flagged)
    if start_time:
        query = query.where(Alert.timestamp >= start_time)
    if end_time:
        query = query.where(Alert.timestamp <= end_time)

    result = await db.execute(query.order_by(Alert.timestamp.desc()).offset(offset).limit(limit))
    return result.scalars().all()

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert_detail(
    alert_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetch full intelligence details for a specific alert."""
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
    """Universal update endpoint for status, notes, flags, and saves."""
    result = await db.execute(
        select(Alert).where(
            Alert.id == alert_id, 
            Alert.workspace_id == current_user.workspace_id
        )
    )
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert record not found.")
    
    # Only update fields that were explicitly sent in the request
    update_data = triage_data.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(alert, key, value)
        
    await db.commit()
    return {"message": "Alert updated successfully."}