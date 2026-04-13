from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from ...database import get_db
from ...models import Alert, User
from ...core.security import get_current_active_user

router = APIRouter(prefix="/alerts/stats", tags=["Alert Statistics"])

@router.get("/overview")
async def get_alert_stats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    total = await db.execute(select(func.count(Alert.id)).where(Alert.workspace_id == current_user.workspace_id, Alert.status == "new"))
    critical = await db.execute(select(func.count(Alert.id)).where(Alert.workspace_id == current_user.workspace_id, Alert.severity == "critical", Alert.status == "new"))
    resolved = await db.execute(select(func.count(Alert.id)).where(Alert.workspace_id == current_user.workspace_id, Alert.status == "reviewed"))
    return {
        "active_alerts": total.scalar() or 0,
        "critical_threats": critical.scalar() or 0,
        "resolved_alerts": resolved.scalar() or 0,
        "active_sensors": 1
    }

@router.get("/analysis")
async def get_analysis_stats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    ip_q = await db.execute(select(Alert.source_ip, func.count(Alert.id).label("cnt")).where(Alert.workspace_id == current_user.workspace_id).group_by(Alert.source_ip).order_by(desc("cnt")).limit(5))
    sev_q = await db.execute(select(Alert.severity, func.count(Alert.id).label("cnt")).where(Alert.workspace_id == current_user.workspace_id).group_by(Alert.severity))
    proto_q = await db.execute(select(Alert.protocol, func.count(Alert.id).label("cnt")).where(Alert.workspace_id == current_user.workspace_id).group_by(Alert.protocol))
    
    return {
        "top_attackers": [{"ip": r.source_ip, "count": r.cnt} for r in ip_q],
        "severity_distribution": {r.severity: r.cnt for r in sev_q},
        "protocol_distribution": {r.protocol: r.cnt for r in proto_q}
    }