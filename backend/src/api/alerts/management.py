from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ...database import get_db
from ...models import Alert, User
from ...schemas import AlertResponse, AlertUpdateStatus
from ...core.security import get_current_active_user

router = APIRouter(prefix="/alerts", tags=["Alert Management"])

@router.get("/", response_model=List[AlertResponse])
async def get_workspace_alerts(
    status: str = "new",
    severity: str = "all",
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_active_user) # Aktiflik kontrolü
):
    query_status = "new" if status == "new" else "reviewed"
    query = select(Alert).where(
        Alert.workspace_id == current_user.workspace_id,
        Alert.status == query_status
    )
    if severity != "all":
        query = query.where(Alert.severity == severity)

    result = await db.execute(query.order_by(Alert.timestamp.desc()))
    return result.scalars().all()

@router.patch("/{alert_id}/triage")
async def update_alert_triage(
    alert_id: int, 
    triage_data: AlertUpdateStatus, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.workspace_id == current_user.workspace_id)
    )
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    
    alert.status = triage_data.status
    if hasattr(triage_data, 'notes') and triage_data.notes:
        alert.notes = triage_data.notes
        
    await db.commit()
    return {"message": "Triage complete."}