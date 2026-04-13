from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from src.database import get_db
from src.models import User, Workspace
from src.schemas import UserResponse, WorkspaceResponse, UserRegister
from src.core.security import (
    get_password_hash, 
    verify_password, 
    get_current_admin_user
)

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """GLOBAL ADMIN: Fetch all operatives registered on the platform."""
    result = await db.execute(select(User))
    return result.scalars().all()

@router.get("/workspaces", response_model=List[WorkspaceResponse])
async def get_all_workspaces(
    admin_user: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    """GLOBAL ADMIN: Fetch all active isolated workspaces/tenants."""
    result = await db.execute(select(Workspace))
    return result.scalars().all()

@router.get("/team", response_model=List[UserResponse])
async def get_workspace_team(
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List all operatives assigned to the current admin's workspace."""
    result = await db.execute(
        select(User).where(User.workspace_id == current_admin.workspace_id)
    )
    return result.scalars().all()

@router.post("/team/add", status_code=status.HTTP_201_CREATED)
async def add_team_member(
    user_in: UserRegister, 
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """ADMIN ONLY: Deploy a new operative to the current workspace."""
    # Check for existing email
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Operative already exists.")

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        workspace_id=current_admin.workspace_id,
        role="analyst",  # Default to analyst
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
    current_admin: User = Depends(get_current_admin_user)
):
    """Allows Admin to upgrade/downgrade an operative's clearance level."""
    # Security: Admin can not change their own role
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own administrative role.")

    result = await db.execute(
        select(User).where(User.id == user_id, User.workspace_id == current_admin.workspace_id)
    )
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
    current_admin: User = Depends(get_current_admin_user)
):
    """Enables or disables an operative's account."""
    # Security: Admin can not deactivate their own role 
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot suspend your own administrative account.")

    result = await db.execute(
        select(User).where(User.id == user_id, User.workspace_id == current_admin.workspace_id)
    )
    user_to_update = result.scalars().first()
    
    if not user_to_update:
        raise HTTPException(status_code=404, detail="Operative not found.")

    user_to_update.is_active = not user_to_update.is_active
    
    await db.merge(user_to_update)
    await db.commit()
    
    status_text = "Active" if user_to_update.is_active else "Suspended"
    return {"message": f"Operative status updated to {status_text}.", "new_status": user_to_update.is_active}

@router.patch("/team/{user_id}/reset-password")
async def reset_operative_password(
    user_id: int,
    new_password: str,
    admin_confirm_password: str, 
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Securely reset an operative's password by confirming admin credentials."""
    #  Admin password authentication (Re-authentication)
    if not verify_password(admin_confirm_password, current_admin.hashed_password):
        raise HTTPException(status_code=401, detail="Admin authorization failed. Incorrect confirmation password.")
    
    # find operatives 
    result = await db.execute(
        select(User).where(User.id == user_id, User.workspace_id == current_admin.workspace_id)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Operative not found.")

    # change password 
    user.hashed_password = get_password_hash(new_password)
    await db.commit()
    return {"message": "Operative credentials updated successfully."}