from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from backend.src.database import get_db
from backend.src.models import Alert, User
from backend.src.api.auth import get_current_user

router = APIRouter(prefix="/stats", tags=["Statistics"])

@router.get("/")
async def get_stats(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    # Sadece kullanıcının kendi şirketine ait alarmların toplam sayısını bulalım
    total_alerts_query = await db.execute(
        select(func.count(Alert.id)).where(Alert.company_id == current_user.company_id)
    )
    total_alerts = total_alerts_query.scalar() or 0

    return {
        "total_alerts": total_alerts,
        "company_id": current_user.company_id
    }