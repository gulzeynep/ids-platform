from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Dict, Any

from src.models import Alert

class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_overview_stats(self, workspace_id: int) -> Dict[str, int]:
        """
        Fetches basic overview statistics for the active workspace.
        Used by the alerts/stats endpoint.
        """
        total_q = select(func.count(Alert.id)).where(
            Alert.workspace_id == workspace_id, Alert.status == "new"
        )
        critical_q = select(func.count(Alert.id)).where(
            Alert.workspace_id == workspace_id, 
            Alert.severity == "critical", 
            Alert.status == "new"
        )
        resolved_q = select(func.count(Alert.id)).where(
            Alert.workspace_id == workspace_id, Alert.status == "reviewed"
        )

        total = await self.db.execute(total_q)
        critical = await self.db.execute(critical_q)
        resolved = await self.db.execute(resolved_q)

        return {
            "active_alerts": total.scalar() or 0,
            "critical_threats": critical.scalar() or 0,
            "resolved_alerts": resolved.scalar() or 0,
            "active_sensors": 1  # In the future, this can be queried from a Sensor model
        }

    async def get_detailed_analysis(self, workspace_id: int) -> Dict[str, Any]:
        """
        Fetches grouped analytics data (IPs, Severities, Protocols).
        Used by the alerts/stats/analysis endpoint.
        """
        # Top 5 Source IPs
        ip_q = (
            select(Alert.source_ip, func.count(Alert.id).label("cnt"))
            .where(Alert.workspace_id == workspace_id)
            .group_by(Alert.source_ip)
            .order_by(desc("cnt"))
            .limit(5)
        )
        
        # Breakdown by Severity
        sev_q = (
            select(Alert.severity, func.count(Alert.id).label("cnt"))
            .where(Alert.workspace_id == workspace_id)
            .group_by(Alert.severity)
        )
        
        # Breakdown by Protocol
        proto_q = (
            select(Alert.protocol, func.count(Alert.id).label("cnt"))
            .where(Alert.workspace_id == workspace_id)
            .group_by(Alert.protocol)
        )

        ip_res = await self.db.execute(ip_q)
        sev_res = await self.db.execute(sev_q)
        proto_res = await self.db.execute(proto_q)

        return {
            "top_ips": [{"ip": row[0], "count": row[1]} for row in ip_res.all()],
            "severities": [{"severity": row[0], "count": row[1]} for row in sev_res.all()],
            "protocols": [{"protocol": row[0], "count": row[1]} for row in proto_res.all()]
        }

    async def get_dashboard_summary(self, workspace_id: int) -> Dict[str, Any]:
        """
        Fetches a high-level summary for the main analytics dashboard.
        Used by the analytics/dashboard endpoint.
        """
        total_res = await self.db.execute(
            select(func.count(Alert.id)).where(Alert.workspace_id == workspace_id)
        )
        critical_res = await self.db.execute(
            select(func.count(Alert.id)).where(
                Alert.workspace_id == workspace_id, 
                Alert.severity == "critical"
            )
        )
        
        critical_count = critical_res.scalar() or 0
        
        return {
            "total_events": total_res.scalar() or 0,
            "critical_threats": critical_count,
            "status": "Compromised" if critical_count > 0 else "Secure"
        }