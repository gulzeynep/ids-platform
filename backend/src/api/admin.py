from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models import User, Workspace
from src.schemas import UserResponse, WorkspaceResponse
from src.api.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

# --- SECURITY GATE: ADMINS ONLY ---
def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency to block non-admins from accessing these endpoints."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. This area is restricted to administrators."
        )
    return current_user

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    admin_user: User = Depends(require_admin), 
    db: Session = Depends(get_db)
):
    """Fetch all operatives/users across the entire platform."""
    users = db.query(User).all()
    return users

@router.get("/workspaces", response_model=List[WorkspaceResponse])
def get_all_workspaces(
    admin_user: User = Depends(require_admin), 
    db: Session = Depends(get_db)
):
    """Fetch all isolated workspaces (Companies/Students)."""
    workspaces = db.query(Workspace).all()
    return workspaces