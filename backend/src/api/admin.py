from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from src.database import get_db
from src.models import User, Workspace
from src.schemas import UserResponse, WorkspaceResponse, UserRegister
from .auth import get_current_user, get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

async def require_system_admin(current_user: User = Depends(get_current_user)):
    """Clearance check to ensure only system admins can see global platform data."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Neural link rejected. Administrative clearance required."
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