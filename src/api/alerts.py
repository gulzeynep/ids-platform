from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.database import get_db
from src.models import Alert
from typing import List
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter(prefix="/alerts", tags=["Alert Management"])

@router.get("/")
async def get_alerts(token: str= Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).order_by(Alert.timestamp.desc()))
    return result.scalars().all()

@router.get("/{alert_id}")
async def get_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.get(Alert, alert_id)
    if not result:
        raise HTTPException(status_code=404, detail="Alarm bulunamadı")
    return result

@router.delete("/{alert_id}")
async def delete_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alarm not found")
    
    await db.delete(alert)
    await db.commit()
    return {"message": f"ID {alert_id} is successfuly deleted"}