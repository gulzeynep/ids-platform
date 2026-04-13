from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.database import get_db
from src.models import User
from src.schemas import UserResponse, WorkspaceResponse
from src.core.security import get_current_admin_user
from src.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

def get_admin_service(db: AsyncSession = Depends(get_db)) -> AdminService:
    return AdminService(db)

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    admin_user: User = Depends(get_current_admin_user),
    service: AdminService = Depends(get_admin_service)
):
    """GLOBAL ADMIN: Fetch all operatives registered on the platform."""
    return await service.get_all_users()

@router.get("/workspaces", response_model=List[WorkspaceResponse])
async def get_all_workspaces(
    admin_user: User = Depends(get_current_admin_user), 
    service: AdminService = Depends(get_admin_service)
):
    """GLOBAL ADMIN: Fetch all active isolated workspaces/tenants."""
    return await service.get_all_workspaces()

@router.get("/team", response_model=List[UserResponse])
async def get_workspace_team(
    current_admin: User = Depends(get_current_admin_user),
    service: AdminService = Depends(get_admin_service)
):
    """WORKSPACE ADMIN: Fetch all operatives in the current admin's workspace."""
    return await service.get_workspace_team(workspace_id=current_admin.workspace_id)

@router.patch("/team/{user_id}/toggle-status")
async def toggle_operative_status(
    user_id: int, 
    current_admin: User = Depends(get_current_admin_user),
    service: AdminService = Depends(get_admin_service)
):
    """Suspend or activate a team member's account."""
    result = await service.toggle_operative_status(
        user_id=user_id, 
        workspace_id=current_admin.workspace_id
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operative not found.")
    return result

@router.patch("/team/{user_id}/reset-password")
async def reset_operative_password(
    user_id: int,
    new_password: str,
    admin_confirm_password: str, 
    current_admin: User = Depends(get_current_admin_user),
    service: AdminService = Depends(get_admin_service)
):
    """Securely reset an operative's password by confirming admin credentials."""
    success = await service.reset_operative_password(
        user_id=user_id,
        workspace_id=current_admin.workspace_id,
        current_admin=current_admin,
        new_password=new_password,
        admin_confirm_password=admin_confirm_password
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operative not found.")
    return {"message": "Password has been reset successfully."}