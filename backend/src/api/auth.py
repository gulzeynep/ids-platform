import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter 
from slowapi.util import get_remote_address

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from ..database import get_db
from ..models import User, Workspace
from ..schemas import UserRegister, UserResponse, UserProfileUpdate
from ..core.security import ( get_password_hash, verify_password, create_access_token, get_current_user)
from ...config import settings

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

ACCESS_TOKEN_EXPIRE_MINUTES = settings. ACCESS_TOKEN_EXPIRE_MINUTES

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
    
    new_user = User(
        email=user_data.email, 
        hashed_password=get_password_hash(user_data.password)
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
    # Prevent re-onboarding if already in a workspace
    if current_user.workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operative is already assigned to a Workspace."
        )

    # Create the new Workspace for the user
    new_workspace = Workspace(
        name=onboard_data.company_name,
        api_key=secrets.token_hex(32)  # Generates a secure random 64-character API Key
    )
    db.add(new_workspace)
    await db.commit()
    await db.refresh(new_workspace)

    # Update the current user with profile data and link to workspace
    current_user.full_name = onboard_data.full_name
    current_user.user_persona = onboard_data.user_persona
    current_user.role = "admin"  # The first user to onboard is the admin of that workspace
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