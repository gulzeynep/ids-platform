from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from src.database import get_db
from src.models import User, Workspace
from src.schemas import UserResponse, WorkspaceResponse, UserRegister
from src.core.security import get_current_user, get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

async def require_system_admin(current_user: User = Depends(get_current_user)):
    """Clearance check to ensure only system admins can see global platform data."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized"
        )
    return current_user

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    admin_user: User = Depends(require_system_admin), 
    db: AsyncSession = Depends(get_db)
):
    """GLOBAL ADMIN: Fetch all operatives registered on the W-IDS platform."""
    result = await db.execute(select(User))
    return result.scalars().all()

@router.get("/workspaces", response_model=List[WorkspaceResponse])
async def get_all_workspaces(
    admin_user: User = Depends(require_system_admin), 
    db: AsyncSession = Depends(get_db)
):
    """GLOBAL ADMIN: Fetch all active isolated workspaces/tenants."""
    result = await db.execute(select(Workspace))
    return result.scalars().all()

@router.get("/team", response_model=List[UserResponse])
async def get_workspace_team(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all operatives assigned to the current workspace."""
    result = await db.execute(
        select(User).where(User.workspace_id == current_user.workspace_id)
    )
    return result.scalars().all()

@router.post("/team/add", status_code=status.HTTP_201_CREATED)
async def add_team_member(
    user_in: UserRegister, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ADMIN ONLY: Deploy a new operative to the current workspace."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. Administrative clearance required."
        )

    # Check for existing email
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Operative already exists.")

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        workspace_id=current_user.workspace_id,
        role="analyst",  # New members default to Analyst
        is_active=True
    )
    
    db.add(new_user)
    await db.commit()
    return {"message": "New operative successfully deployed."}

@router.patch("/team/{user_id}/grant-access")
async def grant_operative_access(
    user_id: int,
    new_role: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_system_admin)
):
    """Allows Admin to upgrade/downgrade an operative's clearance level."""
    result = await db.execute(select(User).where(User.id == user_id, User.workspace_id == admin_user.workspace_id))
    user_to_update = result.scalars().first()
    
    if not user_to_update:
        raise HTTPException(status_code=404, detail="Operative not found in this workspace.")
        
    user_to_update.role = new_role
    await db.commit()
    return {"message": f"Access granted as {new_role}."}

@router.patch("/team/{user_id}/toggle-access")
async def toggle_operative_access(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Kullanıcıyı bul
    result = await db.execute(
        select(User).where(User.id == user_id, User.workspace_id == current_user.workspace_id)
    )
    user_to_update = result.scalars().first()
    
    if not user_to_update:
        raise HTTPException(status_code=404, detail="Operative not found.")

    # 2. DURUMU DEĞİŞTİR (En kritik kısım)
    user_to_update.is_active = not user_to_update.is_active
    
    # 3. ZORLA KAYDET
    await db.merge(user_to_update) # Nesneyi session'a tekrar bağla
    await db.commit() # Değişikliği kalıcı yap
    
    return {"message": "Success", "new_status": user_to_update.is_active}