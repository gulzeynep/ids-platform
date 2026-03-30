from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.database import get_db
from src.models import Alert

router = APIRouter(prefix= "/alerts", tags = ["IDS Alerts"])

@router.get("/")
async def get_all_alerts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert))
    alerts = result.scalars().all()
    return alerts

@router.post("/create")
async def create_alert(alert_type: str, severity: str, ip: str, db: AsyncSession = Depends(get_db)):
    new_alert = Alert(type=alert_type, severity=severity, source_ip=ip)
    db.add(new_alert)
    await db.commit()
    await db.refresh(new_alert)
    return new_alert