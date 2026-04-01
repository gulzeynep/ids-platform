from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta, timezone
import time

from backend.src.database import get_db
from backend.src.models import Alert, User
from backend.src.api.auth import get_current_user

router = APIRouter(prefix="/stats", tags=["Statistics"])

_cache = {
    "data": None,
    "expiry": 0
}
CACHE_SECONDS = 10 

@router.get("/summary")
async def get_cached_summary(db: AsyncSession = Depends(get_db)):
    current_time = time.time()
    if _cache["data"] and current_time < _cache["expiry"]:
        return _cache["data"]
    
    # Total Alerts Count
    total_result = await db.execute(select(func.count(Alert.id)))
    total_alerts = total_result.scalar() or 0

    # Last 24 Hours 
    one_day_ago = datetime.now(timezone.utc) - timedelta(days=1)
    recent_result = await db.execute(
        select(func.count(Alert.id)).where(Alert.timestamp >= one_day_ago)
    )
    recent_alerts = recent_result.scalar() or 0

    summary_data = {
        "total_alerts": total_alerts,
        "alerts_last_24h": recent_alerts,
        "system_status": "Healthy" if recent_alerts < 100 else "Critical"
    }
    
    _cache["data"] = summary_data
    _cache["expiry"] = current_time + CACHE_SECONDS
    return summary_data

@router.get("/top-ips") 
async def get_top_attacking_ips(
    limit: int = Query(5, gt=0), 
    db: AsyncSession = Depends(get_db)
):
    
    query = (
        select(Alert.source_ip, func.count(Alert.id))
        .group_by(Alert.source_ip)
        .order_by(func.count(Alert.id).desc())
        .limit(limit)
    )
    result = await db.execute(query)
    top_ips = result.all()
    return [{"source_ip": row[0], "count": row[1]} for row in top_ips]

@router.get("/by-severity")
async def get_stats_by_severity(db: AsyncSession = Depends(get_db)):
    query = (
        select(Alert.severity, func.count(Alert.id))
        .group_by(Alert.severity)
    )
    result = await db.execute(query)
    rows = result.all()
    return [{"name": row[0], "value": row[1]} for row in rows]

@router.get("/my-stats")
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Toplam alarm sayısı
    total_query = select(func.count(Alert.id)).where(Alert.owner_id == current_user.id)
    total_result = await db.execute(total_query)
    total = total_result.scalar() or 0

    # En çok yapılan saldırı tipi
    top_attack_query = (
        select(Alert.type, func.count(Alert.id))
        .where(Alert.owner_id == current_user.id)
        .group_by(Alert.type)
        .order_by(func.count(Alert.id).desc())
        .limit(1)
    )
    top_attack_result = await db.execute(top_attack_query)
    top_attack = top_attack_result.first()

    return {
        "total_alerts": total,
        "top_attack_type": top_attack[0] if top_attack else "None",
        "company": current_user.company_name
    }