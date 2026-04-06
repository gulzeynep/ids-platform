from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime

from backend.src.database import get_db
from backend.src.models import Alert, User
from backend.src.schemas import AlertCreate, AlertResponse, AlertUpdateStatus
from backend.src.api.auth import get_current_user
from backend.src.core.mailer import send_security_alert
from backend.src.core.ws_manager import manager 

router = APIRouter(prefix="/alerts", tags=["Intrusions & Alerts"])

@router.post("/", response_model=AlertResponse)
async def create_alert(
    alert_in: AlertCreate, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    # 1. Veritabanına Kayıt İşlemi
    new_alert = Alert(
        type=alert_in.type,
        severity=alert_in.severity,
        source_ip=alert_in.source_ip,
        destination_ip=alert_in.destination_ip,
        source_port=alert_in.source_port,
        destination_port=alert_in.destination_port,
        protocol=alert_in.protocol,
        action=alert_in.action,
        status="new",
        company_id=current_user.company_id,
        owner_id=current_user.id
    )
    db.add(new_alert)
    await db.commit()
    await db.refresh(new_alert)

    # 2. CANLI YAYIN TETİKLEYİCİSİ (FRONTEND'E BİLDİRİM FIRLAT)
    alert_payload = {
        "id": new_alert.id,
        "type": new_alert.type,
        "severity": new_alert.severity,
        "source_ip": new_alert.source_ip,
        "destination_ip": new_alert.destination_ip,
        "action": new_alert.action,
        "status": new_alert.status,
        "timestamp": new_alert.timestamp.isoformat() if new_alert.timestamp else datetime.utcnow().isoformat()
    }
    if alert_in.severity.lower() == "critical":
        # Background task kullanarak sistemi yavaşlatmadan maili sıraya alıyoruz
        background_tasks.add_task(
            send_security_alert, 
            current_user.email, 
            alert_in.type, 
            alert_in.severity, 
            alert_in.source_ip
        )
    # Haberi sadece o şirketin açık olan ekranlarına (React) yolla
    await manager.broadcast_to_company(alert_payload, current_user.company_id)

    return new_alert


@router.get("/list", response_model=List[AlertResponse])
async def list_alerts(
    status: str = None,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    query = select(Alert).where(Alert.company_id == current_user.company_id)
    if status:
        query = query.where(Alert.status == status)
        
    query = query.order_by(Alert.timestamp.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{alert_id}/status", response_model=AlertResponse)
async def update_alert_status(
    alert_id: int,
    status_update: AlertUpdateStatus,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Alert).where(Alert.id == alert_id, Alert.company_id == current_user.company_id)
    result = await db.execute(query)
    alert = result.scalars().first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alarm bulunamadı.")

    alert.status = status_update.status
    alert.owner_id = current_user.id 
    
    await db.commit()
    await db.refresh(alert)
    return alert