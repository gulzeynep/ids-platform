from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Sequence, Any

from src.models import User, Notification

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def update_user_settings(self, current_user: User, settings_data: Dict[str, Any]) -> Dict[str, str]:
        """Updates operative notification and alert preferences."""
        if "alert_email" in settings_data:
            current_user.alert_email = settings_data["alert_email"]
        if "enable_email_notifications" in settings_data:
            current_user.enable_email_notifications = settings_data["enable_email_notifications"]
        if "min_severity_level" in settings_data:
            current_user.min_severity_level = settings_data["min_severity_level"]

        await self.db.commit()
        return {"status": "success", "message": "Neural settings synchronized."}

    async def get_workspace_notifications(self, workspace_id: int, limit: int = 20) -> Sequence[Notification]:
        """Fetches the latest workspace-wide system and security notifications."""
        query = (
            select(Notification)
            .where(Notification.workspace_id == workspace_id)
            .order_by(Notification.timestamp.desc())
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def mark_notification_read(self, notif_id: int, workspace_id: int) -> bool:
        """Marks a specific workspace notification as acknowledged/read."""
        query = select(Notification).where(
            Notification.id == notif_id,
            Notification.workspace_id == workspace_id
        )
        result = await self.db.execute(query)
        notif = result.scalars().first()
        
        if not notif:
            return False
            
        notif.is_read = True
        await self.db.commit()
        return True