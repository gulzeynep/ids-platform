from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from src.database import get_db
from src.models import User, Workspace
from src.schemas import UserResponse, WorkspaceResponse
from .auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

# --- SECURITY GATE: SYSTEM ADMINS ONLY ---
async def require_system_admin(current_user: User = Depends(get_current_user)):
    """Clearance check to ensure only system admins can see global data."""
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
    """Fetch all operatives registered on the platform."""
    result = await db.execute(select(User))
    return result.scalars().all()

@router.get("/workspaces", response_model=List[WorkspaceResponse])
async def get_all_workspaces(
    admin_user: User = Depends(require_system_admin), 
    db: AsyncSession = Depends(get_db)
):
    """Fetch all active isolated workspaces."""
    result = await db.execute(select(Workspace))
    return result.scalars().all()