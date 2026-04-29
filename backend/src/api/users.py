from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from src.database import get_db
from src.models import User, Notification
from src.schemas import UserResponse, UserRegister
from src.core.security import get_current_user, get_password_hash

router = APIRouter(prefix="/management", tags=["User & Workspace Management"])

@router.patch("/settings")
async def update_user_settings(
    settings_in: dict, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """Update operative notification and alert preferences."""
    if "alert_email" in settings_in:
        current_user.alert_email = settings_in["alert_email"]
    if "enable_email_notifications" in settings_in:
        current_user.enable_email_notifications = settings_in["enable_email_notifications"]
    if "min_severity_level" in settings_in:
        current_user.min_severity_level = settings_in["min_severity_level"]

    await db.commit()
    return {"status": "success", "message": "Neural settings synchronized."}

@router.get("/notifications")
async def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch the latest workspace-wide system and security notifications."""
    result = await db.execute(
        select(Notification)
        .where(Notification.workspace_id == current_user.workspace_id)
        .order_by(Notification.timestamp.desc())
        .limit(20)
    )
    return result.scalars().all()

@router.patch("/notifications/{notif_id}/read")
async def mark_notification_as_read(
    notif_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marks a specific workspace notification as acknowledged/read."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notif_id,
            Notification.workspace_id == current_user.workspace_id
        )
    )
    notif = result.scalars().first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
        
    notif.is_read = True
    await db.commit()
    return {"message": "Notification cleared."}