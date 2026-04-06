from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from backend.src.database import get_db
from backend.src.models import Alert, User
from backend.src.schemas import AlertCreate, AlertResponse, AlertUpdateStatus
from backend.src.api.auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["Intrusions & Alerts"])

# 1. YENİ ALARM OLUŞTUR (Sensörler buraya istek atacak)
@router.post("/", response_model=AlertResponse)
async def create_alert(
    alert_in: AlertCreate, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    new_alert = Alert(
        type=alert_in.type,
        severity=alert_in.severity,
        source_ip=alert_in.source_ip,
        destination_ip=alert_in.destination_ip,
        source_port=alert_in.source_port,
        destination_port=alert_in.destination_port,
        protocol=alert_in.protocol,
        action=alert_in.action,
        status="new", # İlk geldiğinde her zaman "yeni"dir
        company_id=current_user.company_id,
        owner_id=current_user.id
    )
    db.add(new_alert)
    await db.commit()
    await db.refresh(new_alert)
    return new_alert

# 2. ALARMLARI LİSTELE (Analysis ve Intrusion sayfaları için)
@router.get("/list", response_model=List[AlertResponse])
async def list_alerts(
    status: str = None, # URL'den filtreleme yapabilmek için (Örn: ?status=new)
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    query = select(Alert).where(Alert.company_id == current_user.company_id)
    
    # Eğer frontend sadece "incelenmemiş" olanları isterse filtrele
    if status:
        query = query.where(Alert.status == status)
        
    query = query.order_by(Alert.timestamp.desc())
    result = await db.execute(query)
    return result.scalars().all()

# 3. ALARM DURUMUNU GÜNCELLE (Analist "İncelendi" butonuna basınca çalışır)
@router.patch("/{alert_id}/status", response_model=AlertResponse)
async def update_alert_status(
    alert_id: int,
    status_update: AlertUpdateStatus,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Alarmı bul
    query = select(Alert).where(Alert.id == alert_id, Alert.company_id == current_user.company_id)
    result = await db.execute(query)
    alert = result.scalars().first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alarm bulunamadı veya yetkiniz yok.")

    # Durumu güncelle (Örn: "new" -> "reviewed")
    alert.status = status_update.status
    alert.owner_id = current_user.id # İnceleyen kişi olarak kendini ata
    
    await db.commit()
    await db.refresh(alert)
    return alert