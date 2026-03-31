from fastapi import APIRouter, Depends
from sqlalchemy import func 
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.database import get_db
from src.models import Alert
from datetime import datetime, timedelta
import time 


router = APIRouter(prefix="/stats", tags=["Statistics"])

_cache = {
    "data": None,
    "expiry": 0
}
CACHE_SECONDS = 10 

@router.get("/summary")
async def get_cached_summary(db: AsyncSession = Depends(get_db)):
    current_time=time.time()
    if _cache["data"] and current_time < _cache["expiry"]:
        return _cache["data"]
    
    total_result = await db.execute(select(func.count(Alert.id)))
    total_alerts = total_result.scalar()

    one_day_ago = datetime.utcnow() - timedelta(days=1)
    recent_result = await db.execute(
        select(func.count(Alert.id)).where(Alert.timestamp >= one_day_ago)
    )
    recent_alerts = recent_result.scalar()
    summary_data = {
        "total_alerts": total_alerts,
        "alerts_last_24h": recent_alerts,
        "system_status": "Healthy" if recent_alerts < 100 else "Critical"
    }
    _cache["data"]= summary_data
    _cache["expiry"] = current_time + CACHE_SECONDS

    return summary_data

@router.get("/by-severity")
async def get_stats_by_severity(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select,(Alert.source_ip,func.count(Alert.id))
        .group_by(Alert.source_ip)
        .order_by(func.count(Alert.id).desc())
        .limmit(limit)
    )
    top_ips = result.all()
    return [{"source_ip": row[0], "count": row[1]} for row in top_ips]