from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ...database import get_db
from ...models import User
from ...schemas import AlertResponse, AlertUpdateStatus
from ...core.security import get_current_active_user
from ...services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alert Management"])

def get_alert_service(db: AsyncSession = Depends(get_db)) -> AlertService:
    """Dependency injector for AlertService"""
    return AlertService(db)

@router.get("/", response_model=List[AlertResponse])
async def get_workspace_alerts(
    status_filter: str = "new", 
    severity: str = "all",
    service: AlertService = Depends(get_alert_service),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieves a filtered list of alerts for the active workspace."""
    alerts = await service.get_alerts_by_filter(
        workspace_id=current_user.workspace_id,
        status=status_filter,
        severity=severity
    )
    return alerts

@router.patch("/{alert_id}/triage")
async def update_alert_triage(
    alert_id: int, 
    triage_data: AlertUpdateStatus, 
    service: AlertService = Depends(get_alert_service),
    current_user: User = Depends(get_current_active_user)
):
    """Allows analysts to update the status and add notes to an alert."""
    updated_alert = await service.update_alert_status(
        alert_id=alert_id,
        workspace_id=current_user.workspace_id,
        triage_data=triage_data
    )
    
    if not updated_alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Alert not found or access denied."
        )
        
    return {"message": "Triage complete.", "status": updated_alert.status}

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert_detail(
    alert_id: int, 
    service: AlertService = Depends(get_alert_service), 
    current_user: User = Depends(get_current_active_user)
):
    """Fetches the detailed information of a specific alert."""
    alert = await service.get_alert_by_id(
        alert_id=alert_id, 
        workspace_id=current_user.workspace_id
    )
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Alert not found or access denied."
        )
        
    return alert