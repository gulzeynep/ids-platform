from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from backend.src.database import get_db
from backend.src.models import Alert, User
from backend.src.schemas import AlertDisplay, AlertCreate
from backend.src.api.auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alert Management"])

@router.get("/list", response_model=List[AlertDisplay])
async def get_alerts_list(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # Giriş yapan kullanıcıyı alıyoruz
):
    # GÜVENLİK FİLTRESİ: Sadece kullanıcının şirketine ait verileri çek
    query = select(Alert).where(Alert.company_id == current_user.company_id).order_by(Alert.timestamp.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/ingest")
async def ingest_alert(
    alert: AlertCreate,
    db: AsyncSession = Depends(get_db)
):
    # Sensörden (IDS Engine) gelen veri
    new_alert = Alert(**alert.model_dump())
    db.add(new_alert)
    await db.commit()
    await db.refresh(new_alert)
    return {"status": "success", "id": new_alert.id}