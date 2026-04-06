from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from backend.src.database import get_db
from backend.src.models import User, Company
from backend.src.schemas import UserResponse
from backend.src.api.auth import get_current_user, require_super_admin, require_company_admin

router = APIRouter(prefix="/management", tags=["User & Company Management"])

@router.patch("/settings")
async def update_user_settings(
    settings_in: dict, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    # Kullanıcıyı DB'den bul
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalars().first()

    # Ayarları güncelle (Pydantic şeması ile yapmak daha temizdir ama şimdilik hızlıca böyle yapalım)
    user.alert_email = settings_in.get("alert_email", user.alert_email)
    user.enable_email_notifications = settings_in.get("enable_email_notifications", user.enable_email_notifications)
    user.enable_in_app_notifications = settings_in.get("enable_in_app_notifications", user.enable_in_app_notifications)
    user.min_severity_level = settings_in.get("min_severity_level", user.min_severity_level)

    await db.commit()
    return {"status": "success", "message": "Settings updated."}

@router.get("/notifications", response_model=List[dict])
async def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.timestamp.desc())
        .limit(20)
    )
    return result.scalars().all()

@router.post("/notifications/{notif_id}/read")
async def mark_notification_as_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification).where(Notification.id == notif_id, Notification.user_id == current_user.id)
    )
    notif = result.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    await db.commit()
    return {"message": "Marked as read"}


# --- DEVELOPER (SUPER ADMIN) ÖZEL: TÜM MÜŞTERİLER ---
@router.get("/all-companies", response_model=List[dict])
async def get_all_platforms(
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    # Developer olarak tüm şirketleri ve üye sayılarını gör
    result = await db.execute(select(Company))
    companies = result.scalars().all()
    
    return [
        {
            "id": c.id, 
            "name": c.name, 
            "plan": c.subscription_plan,
            "created_at": c.created_at
        } for c in companies
    ]

# --- COMPANY ADMIN ÖZEL: KENDİ EKİBİ ---
@router.get("/team", response_model=List[UserResponse])
async def get_company_team(
    admin: User = Depends(require_company_admin),
    db: AsyncSession = Depends(get_db)
):
    # Sadece kendi şirketindeki analistleri listele
    result = await db.execute(
        select(User).where(User.company_id == admin.company_id)
    )
    users = result.scalars().all()
    return users

# --- ANALYST ÖZEL: KENDİ ÖZETİ ---
@router.get("/my-performance")
async def get_my_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Bu kullanıcı kaç tane 'reviewed' alarm yapmış? (İleride ekleyeceğiz)
    return {
        "user": user.username,
        "role": user.role,
        "tasks_completed": 0 # Placeholder for now
    }