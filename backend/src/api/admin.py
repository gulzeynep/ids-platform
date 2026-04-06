from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from backend.src.database import get_db
from backend.src.models import User, Company
from backend.src.schemas import UserResponse, CompanyResponse
from backend.src.api.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

# --- GÜVENLİK KAPISI: SADECE ADMİNLER GİREBİLİR ---
def require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Erişim reddedildi. Bu alan sadece yöneticiler içindir.")
    return current_user

# Tüm kullanıcıları getir (Sadece Admin)
@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    admin_user: User = Depends(require_admin), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    # Kullanıcıların şirket isimlerini de ekleyerek döndür
    user_responses = []
    for user in users:
        company_name = None
        if user.company_id:
            comp = await db.execute(select(Company).where(Company.id == user.company_id))
            company_obj = comp.scalars().first()
            if company_obj:
                company_name = company_obj.name
        
        user_responses.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_admin": user.is_admin,
            "company_name": company_name
        })
    return user_responses

# Tüm şirketleri getir (Sadece Admin)
@router.get("/companies", response_model=List[CompanyResponse])
async def get_all_companies(
    admin_user: User = Depends(require_admin), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Company))
    return result.scalars().all()