from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import Alert, User, Notification
from ..schemas import AlertCreate, AlertResponse
from ..auth import get_current_user
from ..utils.notifications import send_security_alert
from .websocket import manager # WebSocket bağlantı yöneticin

router = APIRouter()

@router.post("/", response_model=AlertResponse)
async def create_alert(
    alert_in: AlertCreate,
    background_tasks: BackgroundTasks, # Arka plan işlemleri için şart
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. ALARMI VERİTABANINA KAYDET
    new_alert = Alert(
        **alert_in.dict(),
        user_id=current_user.id,
        timestamp=datetime.utcnow()
    )
    db.add(new_alert)
    await db.commit()
    await db.refresh(new_alert)

    # 2. UYGULAMA İÇİ BİLDİRİM (IN-APP FEED) OLUŞTURMA
    # Kullanıcı ayarlarında bildirimler açıksa DB'ye kaydet
    if current_user.enable_in_app_notifications:
        new_notif = Notification(
            title=f"🚨 {alert_in.severity.upper()} Detection",
            body=f"{alert_in.type} attempt identified from {alert_in.source_ip}",
            type="security",
            user_id=current_user.id,
            timestamp=datetime.utcnow()
        )
        db.add(new_notif)
        await db.commit()

        # 3. WEBSOCKET ÜZERİNDEN ANLIK PUSH (Frontend'de Pop-up için)
        await manager.send_personal_message({
            "type": "NOTIFICATION_RECEIVED",
            "title": new_notif.title,
            "severity": alert_in.severity,
            "message": new_notif.body
        }, current_user.id)

    # 4. AKILLI EMAIL RÖLESİ (SaaS MANTIĞI)
    # Önem derecesine göre filtreleme yapıyoruz
    severity_weights = {"low": 1, "medium": 2, "high": 3, "critical": 4}
    user_min_level = severity_weights.get(current_user.min_severity_level.lower(), 3)
    alert_level = severity_weights.get(alert_in.severity.lower(), 1)

    # Eğer email bildirimleri açıksa VE alarm seviyesi kullanıcının istediği düzeydeyse
    if current_user.enable_email_notifications and alert_level >= user_min_level:
        # SMTP işlemleri yavaş olduğu için BackgroundTasks ile ana akışı bloklamadan gönderiyoruz
        target_email = current_user.alert_email or current_user.email
        
        background_tasks.add_task(
            send_security_alert,
            target_email,
            alert_in.type,
            alert_in.source_ip,
            alert_in.severity
        )

    # 5. WEBSOCKET ÜZERİNDEN GRAFİK GÜNCELLEMESİ
    # Dashboard'daki grafikleri ve listeyi anlık yenilemek için
    await manager.send_personal_message({
        "type": "NEW_ALERT",
        "alert": {
            "id": new_alert.id,
            "type": new_alert.type,
            "severity": new_alert.severity,
            "source_ip": new_alert.source_ip,
            "timestamp": new_alert.timestamp.isoformat()
        }
    }, current_user.id)

    return new_alert

@router.get("/", response_model=List[AlertResponse])
async def get_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 100
):
    # Sadece giriş yapan kullanıcının/şirketin alarmlarını getir
    result = await db.execute(
        select(Alert)
        .where(Alert.user_id == current_user.id)
        .order_by(Alert.timestamp.desc())
        .limit(limit)
    )
    return result.scalars().all()