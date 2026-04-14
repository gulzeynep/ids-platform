from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from ...database import get_db
from ...models import Alert, User
from ..auth import get_current_user

router = APIRouter(prefix="/stats") 

@router.get("/overview")
async def get_alert_stats(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):    
    """Calculates live metrics for the Overview Dashboard."""
    total_query = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.workspace_id == current_user.workspace_id, 
            Alert.status == "new"
            )
        )
    critical_query = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.workspace_id == current_user.workspace_id, 
            Alert.severity == "critical", 
            Alert.status == "new"
            )
        )
    resolved_query = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.workspace_id == current_user.workspace_id, 
            Alert.status == "reviewed"
            )
        )

    return {
        "active_alerts": total_query.scalar() or 0,
        "critical_threats": critical_query.scalar() or 0,
        "resolved_alerts": resolved_query.scalar() or 0,
        "active_sensors": 1
    }

@router.get("/analysis")
async def get_analysis_stats(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Generates intelligence metrics for the Analysis Dashboard."""
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