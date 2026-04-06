from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from backend.src.database import get_db
from backend.src.models import Alert, User
from backend.src.api.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Dashboard Analytics"])

@router.get("/overview")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    company_id = current_user.company_id

    # Toplam alarm sayısı
    total_query = await db.execute(select(func.count(Alert.id)).where(Alert.company_id == company_id))
    total_alerts = total_query.scalar() or 0

    # Kritik alarm sayısı
    critical_query = await db.execute(
        select(func.count(Alert.id))
        .where(Alert.company_id == company_id, Alert.severity == "critical")
    )
    critical_alerts = critical_query.scalar() or 0

    # İncelenmeyi bekleyen (New) alarm sayısı
    pending_query = await db.execute(
        select(func.count(Alert.id))
        .where(Alert.company_id == company_id, Alert.status == "new")
    )
    pending_alerts = pending_query.scalar() or 0

    return {
        "total_events": total_alerts,
        "critical_threats": critical_alerts,
        "pending_reviews": pending_alerts,
        "network_status": "Secure" if critical_alerts == 0 else "Under Attack",
        "company_id": company_id
    }