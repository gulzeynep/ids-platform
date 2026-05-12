import os
import secrets
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter 
from slowapi.util import get_remote_address

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from src.database import get_db
from src.models import User, Workspace
from src.schemas import UserRegister, UserResponse, UserProfileUpdate, PasswordChangeRequest
from src.core.security import ( get_password_hash, verify_password, create_access_token, get_current_user)
from config import settings

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

ACCESS_TOKEN_EXPIRE_MINUTES = settings. ACCESS_TOKEN_EXPIRE_MINUTES


def current_sensor_api_key() -> str:
    key_file = Path(os.getenv("SENSOR_KEY_FILE", "/var/log/snort/sensor_key"))
    if key_file.exists():
        key = key_file.read_text(encoding="utf-8").strip()
        if key:
            return key
    return settings.API_KEY


async def get_or_create_sensor_workspace(db: AsyncSession) -> Workspace:
    api_key = current_sensor_api_key()
    result = await db.execute(select(Workspace).where(Workspace.api_key == api_key))
    workspace = result.scalars().first()
    if workspace:
        return workspace

    workspace = Workspace(
        name="IDS Demo Workspace",
        api_key=api_key,
    )
    db.add(workspace)
    await db.commit()
    await db.refresh(workspace)
    return workspace

#  REGISTRATION 
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserRegister, 
    db: AsyncSession = Depends(get_db)
):
    """Raw Registration"""
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="User already registered.")
    
    workspace = await get_or_create_sensor_workspace(db)

    new_user = User(
        email=user_data.email, 
        hashed_password=get_password_hash(user_data.password),
        workspace_id=workspace.id,
        role="admin",
    )
    db.add(new_user)
    await db.commit()
    return {"message": "Success"}

# LOGIN (TOKEN GENERATION)
@router.post("/token") 
@limiter.limit("5/minute")
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # extra check at login 
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended."
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


# ONBOARDING 
@router.post("/onboard", status_code=status.HTTP_200_OK)
async def complete_onboarding(
    onboard_data: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Completes the user registration by creating their isolated Workspace
    and generating the initial Sensor API Key.
    """
    if current_user.workspace_id:
        ws_query = await db.execute(select(Workspace).where(Workspace.id == current_user.workspace_id))
        new_workspace = ws_query.scalars().first()
    else:
        new_workspace = await get_or_create_sensor_workspace(db)

    if new_workspace is None:
        new_workspace = Workspace(
            name=onboard_data.company_name,
            api_key=secrets.token_hex(32)
        )
        db.add(new_workspace)
        await db.commit()
        await db.refresh(new_workspace)

    # Update the current user with profile data and link to workspace
    current_user.full_name = onboard_data.full_name
    current_user.user_persona = onboard_data.user_persona
    current_user.role = "admin"  # The first user to onboard is the admin of that workspace
    if onboard_data.company_name and new_workspace.name in (None, "", "IDS Demo Workspace"):
        new_workspace.name = onboard_data.company_name
    current_user.workspace_id = new_workspace.id
    
    await db.commit()

    return {
        "message": "Onboarding complete.",
        "workspace_name": new_workspace.name,
        "sensor_api_key": new_workspace.api_key
    }


# PROFILE MANAGEMENT 
@router.get("/me")
async def read_users_me(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """Returns the current operative profile with attached workspace data."""
    workspace_name = "Pending Assignment"
    
    if current_user.workspace_id:
        ws_query = await db.execute(select(Workspace).where(Workspace.id == current_user.workspace_id))
        workspace = ws_query.scalars().first()
        if workspace and workspace.name:
            workspace_name = workspace.name

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "user_persona": current_user.user_persona,
        "workspace_id": current_user.workspace_id,
        "workspace_name": workspace_name,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at
    }


class ProfileUpdateStrict(BaseModel):
    full_name: Optional[str] = None
    user_persona: Optional[str] = None

@router.patch("/me")
async def update_my_profile(
    update_data: ProfileUpdateStrict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allows operative to update their basic profile information."""
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
    if update_data.user_persona is not None:
        current_user.user_persona = update_data.user_persona
        
    await db.commit()
    return {"status": "Profile updated successfully."}

@router.patch("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    passwords: PasswordChangeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allows an operative to securely update their access credentials."""
    
    # 1. Verify the current password
    if not verify_password(passwords.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Incorrect current password."
        )
    
    # 2. Prevent reusing the same password
    if passwords.current_password == passwords.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="New password cannot be identical to the current one."
        )
        
    # 3. Hash and store the new password
    current_user.hashed_password = get_password_hash(passwords.new_password)
    await db.commit()
    
    return {"message": "Security credentials updated successfully."}
