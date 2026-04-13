from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ...database import get_db
from ...models import Alert, User
from ...core.security import get_current_active_user

router = APIRouter(prefix="/analytics", tags=["Dashboard Analytics"])

@router.get("/overview")
async def get_dashboard_summary(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    ws_id = current_user.workspace_id
    total_res = await db.execute(select(func.count(Alert.id)).where(Alert.workspace_id == ws_id))
    critical_res = await db.execute(select(func.count(Alert.id)).where(Alert.workspace_id == ws_id, Alert.severity == "critical"))
    critical_count = critical_res.scalar() or 0
    return {
        "total_events": total_res.scalar() or 0,
        "critical_threats": critical_count,
        "status": "Compromised" if critical_count > 0 else "Secure"
    }