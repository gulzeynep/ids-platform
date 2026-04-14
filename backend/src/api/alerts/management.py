from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ...database import get_db
from ...models import Alert, User
from ...schemas import AlertResponse, AlertUpdateStatus
from ..auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[AlertResponse])
async def get_workspace_alerts(
    status: str = "new",
    severity: str = "all",
    limit: int = Query(50, ge=1, le=100), # max 100 at a time 
    offset: int = Query(0, ge=0),         # start point
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query_status = "new" if status == "new" else "reviewed"
    query = select(Alert).where(
        Alert.workspace_id == current_user.workspace_id,
        Alert.status == query_status
    )
    if severity and severity != "all":
        query = query.where(Alert.severity == severity)

    # Offset vand Limit 
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
    """Allows analysts to update threat status and add notes."""
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
    if hasattr(triage_data, 'notes') and triage_data.notes: alert.notes = triage_data.notes
    await db.commit()
    return {"message": "Triage data updated successfully."}