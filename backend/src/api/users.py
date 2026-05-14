from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from src.database import get_db
from src.models import User, Notification
from src.core.logger import logger
from src.core.mailer import send_confirmation_email
from src.schemas import UserResponse, UserRegister, UserSettingsResponse, UserSettingsUpdate
from src.core.security import get_current_user, get_password_hash

router = APIRouter(prefix="/management", tags=["User & Workspace Management"])


def serialize_user_settings(user: User) -> UserSettingsResponse:
    return UserSettingsResponse(
        alert_email=user.alert_email or user.email,
        enable_email_notifications=user.enable_email_notifications is not False,
        min_severity_level=user.min_severity_level or "high",
    )


@router.get("/settings", response_model=UserSettingsResponse)
async def get_user_settings(current_user: User = Depends(get_current_user)):
    """Read operative notification and alert preferences."""
    return serialize_user_settings(current_user)


@router.patch("/settings")
async def update_user_settings(
    settings_in: UserSettingsUpdate,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """Update operative notification and alert preferences."""
    update_data = settings_in.model_dump(exclude_unset=True)
    if "alert_email" in update_data:
        current_user.alert_email = str(update_data["alert_email"]) if update_data["alert_email"] else None
    if "enable_email_notifications" in update_data:
        current_user.enable_email_notifications = update_data["enable_email_notifications"]
    if "min_severity_level" in update_data:
        current_user.min_severity_level = update_data["min_severity_level"]

    await db.commit()
    await db.refresh(current_user)
    return serialize_user_settings(current_user)


@router.post("/settings/test-email")
async def send_settings_confirmation_email(current_user: User = Depends(get_current_user)):
    """Send a confirmation email to the configured alert mailbox."""
    recipient = current_user.alert_email or current_user.email
    try:
        await send_confirmation_email(recipient)
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(
            "Settings confirmation email delivery failed for user_id=%s recipient=%s.",
            current_user.id,
            recipient,
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Email delivery failed. Check SMTP credentials or email service configuration.",
        ) from exc
    return {"status": "sent", "recipient": recipient}

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
