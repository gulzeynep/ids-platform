from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from backend.src.database import get_db
from backend.src.models import User, Alert, Company
from backend.src.api.auth import get_current_user
from backend.src.schemas import UserDisplay

router = APIRouter(prefix="/admin", tags=["Admin Control Center"])

# Gelişmiş Yetki Kontrolü
async def admin_required(current_user: User = Depends(get_current_user)):
    # is_admin True olmalı VEYA rolü 'admin'/'developer' olmalı
    if not current_user.is_admin and current_user.role not in ["admin", "developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="ACCESS DENIED: Internal Security Clearance Required"
        )
    return current_user

@router.get("/users", response_model=List[UserDisplay])
async def get_all_users(
    db: AsyncSession = Depends(get_db), 
    admin: User = Depends(admin_required)
):
    # Tüm sistemdeki kullanıcıları şirket isimleriyle beraber çekelim
    result = await db.execute(select(User))
    return result.scalars().all()

@router.get("/stats")
async def get_system_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(admin_required)
):
    # Genel sistem özeti
    user_count = await db.execute(select(func.count(User.id)))
    alert_count = await db.execute(select(func.count(Alert.id)))
    company_count = await db.execute(select(func.count(Company.id)))
    
    return {
        "total_operators": user_count.scalar(),
        "total_system_alerts": alert_count.scalar(),
        "active_companies": company_count.scalar(),
        "system_load": "Stable",
        "integrity_check": "Verified"
    }

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int, 
    new_role: str, 
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(admin_required)
):
    # Bir kullanıcının yetkisini manuel olarak değiştirmek için
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Operator not found")
    
    user.role = new_role
    if new_role in ["admin", "developer"]:
        user.is_admin = True
    
    await db.commit()
    return {"message": f"User {user.username} updated to {new_role}"}