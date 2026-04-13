from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Sequence, Optional
from src.models import Alert
from src.schemas import AlertCreate, AlertUpdateStatus
from src.core.ws_manager import manager

class AlertService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # --- INGESTION METHODS (From previous step) ---
    
    async def create_alert(self, alert_data: AlertCreate, workspace_id: int) -> Alert:
        alert_dict = alert_data.model_dump()
        alert_dict["workspace_id"] = workspace_id
        db_alert = Alert(**alert_dict)
        
        self.db.add(db_alert)
        await self.db.commit()
        await self.db.refresh(db_alert)
               
        # Broadcast the new alert to the frontend in real-time
        await manager.broadcast_to_workspace(
            workspace_id=workspace_id,
            message={
                "event_type": "new_intrusion",
                "alert_id": db_alert.id,
                "severity": db_alert.severity,
                "source_ip": db_alert.source_ip,
                "protocol": db_alert.protocol
            }
        )
        
        return db_alert

    async def get_recent_alerts(self, workspace_id: int, limit: int = 50) -> Sequence[Alert]:
        query = (
            select(Alert)
            .where(Alert.workspace_id == workspace_id)
            .order_by(Alert.timestamp.desc())
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    # --- MANAGEMENT & TRIAGE METHODS (New Additions) ---

    async def get_alerts_by_filter(self, workspace_id: int, status: str = "new", severity: str = "all") -> Sequence[Alert]:
        """Fetches alerts with status and severity filters for the dashboard."""
        query_status = "new" if status == "new" else "reviewed"
        query = select(Alert).where(
            Alert.workspace_id == workspace_id, 
            Alert.status == query_status
        )
        
        if severity != "all":
            query = query.where(Alert.severity == severity)
            
        result = await self.db.execute(query.order_by(Alert.timestamp.desc()))
        return result.scalars().all()

    async def get_alert_by_id(self, alert_id: int, workspace_id: int) -> Optional[Alert]:
        """Fetches a single alert detail, ensuring it belongs to the workspace."""
        query = select(Alert).where(
            Alert.id == alert_id, 
            Alert.workspace_id == workspace_id
        )
        result = await self.db.execute(query)
        return result.scalars().first()

    async def update_alert_status(self, alert_id: int, workspace_id: int, triage_data: AlertUpdateStatus) -> Optional[Alert]:
        """Updates the status and notes of an alert during triage."""
        alert = await self.get_alert_by_id(alert_id, workspace_id)
        if not alert:
            return None
            
        alert.status = triage_data.status
        if hasattr(triage_data, 'notes') and triage_data.notes: 
            alert.notes = triage_data.notes
            
        await self.db.commit()
        await self.db.refresh(alert)
        return alert