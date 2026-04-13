import secrets
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from ..database import get_db
from ..models import User, Workspace
from ..schemas import UserRegister, UserResponse
from ..core.security import (
    get_password_hash, verify_password, create_access_token, 
    get_current_user, get_current_active_user, 
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()

# ---  REGISTRATION ---
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Step 1: Raw Registration"""
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

# ---  LOGIN (TOKEN GENERATION) ---
@router.post("/token") 
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """OAuth2 compatible token login"""
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token(
        data={"sub": user.email}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer"}


# ---  ONBOARDING SCHEMA & ENDPOINT ---
class OnboardingRequest(BaseModel):
    workspace_name: str  
    persona: str

@router.post("/onboard")
async def complete_onboarding(
    data: OnboardingRequest, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Step 2: Workspace Creation & API Key Generation"""
    if current_user.workspace_id:
        raise HTTPException(status_code=400, detail="Onboarding already complete.")
    
    # 1. Generate secure API key and create Workspace
    api_key = f"wids_live_{secrets.token_urlsafe(32)}"
    new_workspace = Workspace(
        name=data.workspace_name, 
        api_key=api_key 
    )
    db.add(new_workspace)
    await db.flush() # Flush to get the new workspace ID
    
    # 2. Bind the user to this new workspace
    current_user.workspace_id = new_workspace.id
    current_user.user_persona = data.persona
    
    await db.merge(current_user)
    await db.commit()

    return {
        "message": "Workspace initialized successfully.",
        "api_key": api_key
    }


# ---  PROFILE MANAGEMENT ---
@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_active_user),
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
    return {"message": "Profile updated successfully."}