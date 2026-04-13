from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from ..database import get_db
from ..models import User
from ..core.security import get_current_user
from ..services.user_service import UserService

router = APIRouter(prefix="/management", tags=["User & Workspace Management"])

def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(db)

@router.patch("/settings")
async def update_user_settings(
    settings_in: Dict[str, Any], 
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    return await service.update_user_settings(current_user, settings_in)

@router.get("/notifications")
async def get_my_notifications(
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    return await service.get_workspace_notifications(workspace_id=current_user.workspace_id)

@router.patch("/notifications/{notif_id}/read")
async def mark_notification_as_read(
    notif_id: int,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    success = await service.mark_notification_read(notif_id, current_user.workspace_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    return {"status": "success", "message": "Notification acknowledged."}