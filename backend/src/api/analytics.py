from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from src.database import get_db
from src.models import Alert, User
from .auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Dashboard Analytics"])

@router.get("/overview")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    ws_id = current_user.workspace_id

    # Total Alerts Count
    total_res = await db.execute(
        select(func.count(Alert.id)).where(Alert.workspace_id == ws_id)
    )
    total_alerts = total_res.scalar() or 0

    # Critical Alerts Count
    critical_res = await db.execute(
        select(func.count(Alert.id))
        .where(Alert.workspace_id == ws_id, Alert.severity == "critical")
    )
    critical_alerts = critical_res.scalar() or 0

    return {
        "total_events": total_alerts,
        "critical_threats": critical_alerts,
        "status": "Compromised" if critical_alerts > 0 else "Secure"
    }