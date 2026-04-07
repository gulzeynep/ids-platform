from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ..database import get_db
from ..models import User, Notification
from ..schemas import UserResponse
from .auth import get_current_user

router = APIRouter(prefix="/management", tags=["User & Workspace Management"])

@router.patch("/settings")
async def update_user_settings(
    settings_in: dict, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """Update operative notification and alert severity preferences."""
    # Since current_user is already attached to the session via get_current_user
    if "alert_email" in settings_in:
        current_user.alert_email = settings_in["alert_email"]
    if "enable_email_notifications" in settings_in:
        current_user.enable_email_notifications = settings_in["enable_email_notifications"]
    if "min_severity_level" in settings_in:
        current_user.min_severity_level = settings_in["min_severity_level"]

    await db.commit()
    return {"status": "success", "message": "Operative profile synchronized."}

@router.get("/team", response_model=List[UserResponse])
async def get_workspace_team(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lists all team members belonging to the current operative's workspace."""
    # Data Isolation: We only query users with the same workspace_id
    result = await db.execute(
        select(User).where(User.workspace_id == current_user.workspace_id)
    )
    return result.scalars().all()

@router.get("/notifications")
async def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetches the latest workspace-wide security notifications."""
    result = await db.execute(
        select(Notification)
        .where(Notification.workspace_id == current_user.workspace_id)
        .order_by(Notification.timestamp.desc())
        .limit(20)
    )
    return result.scalars().all()