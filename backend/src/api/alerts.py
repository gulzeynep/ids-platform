from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from backend.src.database import get_db
from backend.src.models import Alert, User
from backend.src.schemas import AlertCreate, AlertResponse
from backend.src.api.auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])

# --- YENİ ALARM OLUŞTURMA (SENSÖRLERDEN GELEN) ---
@router.post("/", response_model=AlertResponse)
async def create_alert(
    alert_in: AlertCreate, 
    current_user: User = Depends(get_current_user), # Güvenlik: Sadece giriş yapanlar alarm gönderebilir
    db: AsyncSession = Depends(get_db)
):
    # Gelen veri Pydantic (AlertCreate) tarafından otomatik olarak temizlendi
    # Şimdi veritabanına yazıyoruz
    new_alert = Alert(
        type=alert_in.type,
        severity=alert_in.severity,
        source_ip=alert_in.source_ip,
        company_id=current_user.company_id, # Alarmı, gönderen kişinin şirketine bağlıyoruz
        owner_id=current_user.id
    )
    db.add(new_alert)
    await db.commit()
    await db.refresh(new_alert)
    return new_alert


# --- ALARMLARI LİSTELEME (DASHBOARD İÇİN) ---
@router.get("/list", response_model=List[AlertResponse])
async def list_alerts(
    current_user: User = Depends(get_current_user), # Güvenlik: Giriş yapmayan göremez
    db: AsyncSession = Depends(get_db)
):
    # Sadece kullanıcının kendi şirketine ait alarmları getir! (Multi-Tenant Security)
    # Ayrıca en yeniler en üstte olacak şekilde sırala
    query = select(Alert).where(Alert.company_id == current_user.company_id).order_by(Alert.timestamp.desc())
    result = await db.execute(query)
    alerts = result.scalars().all()
    return alerts