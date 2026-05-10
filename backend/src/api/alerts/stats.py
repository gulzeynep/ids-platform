from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from ...database import get_db
from ...models import Alert, User
from ..auth import get_current_user

router = APIRouter(prefix="/stats", tags=["Alert Statistics"]) 

@router.get("/dashboard")
async def get_dashboard_metrics(
    time_range: str = Query("24h"), 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """overview cards ve system security status"""
    ws_id = current_user.workspace_id
    
    total_q = await db.execute(
        select(func.count(Alert.id))
        .where(
            Alert.workspace_id == ws_id, 
            Alert.status == "new"
            )
        )
    critical_q = await db.execute(
        select(func.count(Alert.id))
        .where(
            Alert.workspace_id == ws_id, 
            Alert.severity == "critical", 
            Alert.status == "new"
            )
        )
    resolved_q = await db.execute(
        select(func.count(Alert.id))
        .where(
            Alert.workspace_id == ws_id, 
            Alert.status == "reviewed"
            )
        )

    total_active = total_q.scalar() or 0
    critical_active = critical_q.scalar() or 0
    total_resolved = resolved_q.scalar() or 0

    return {
        "active_alerts": total_active,
        "critical_threats": critical_active,
        "resolved_alerts": total_resolved,
        "active_sensors": 1,
        "status": "Compromised" if critical_active > 0 else "Secure"
    }

@router.get("/analysis")
async def get_analysis_stats(
    time_range: str = Query("24h"), 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """intelligence metrics """
    ip_query = await db.execute(
        select(Alert.source_ip, func.count(Alert.id).label("attack_count"))
        .where(Alert.workspace_id == current_user.workspace_id)
        .group_by(Alert.source_ip)
        .order_by(desc("attack_count"))
        .limit(5)
    )
    sev_query = await db.execute(
        select(Alert.severity, func.count(Alert.id).label("count"))
        .where(Alert.workspace_id == current_user.workspace_id)
        .group_by(Alert.severity)
    )
    proto_query = await db.execute(
        select(Alert.protocol, func.count(Alert.id).label("count"))
        .where(Alert.workspace_id == current_user.workspace_id)
        .group_by(Alert.protocol)
    )

    return {
        "top_attackers": [{"ip": row.source_ip, "count": row.attack_count} for row in ip_query],
        "severity_distribution": {row.severity: row.count for row in sev_query},
        "protocol_distribution": {row.protocol: row.count for row in proto_query}
    }