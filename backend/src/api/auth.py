from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from ..database import get_db
from ..models import User
from ..schemas import UserRegister
from ..core.security import get_current_user, get_current_active_user
from ..services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)

# ---  REGISTRATION ---
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserRegister, 
    service: AuthService = Depends(get_auth_service)
):
    """Step 1: Raw Registration"""
    return await service.register_user(user_data)

# ---  LOGIN (TOKEN GENERATION) ---
@router.post("/token") 
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    service: AuthService = Depends(get_auth_service)
):
    """OAuth2 compatible token login"""
    return await service.authenticate_user(
        email=form_data.username, 
        password=form_data.password
    )

# ---  ONBOARDING SCHEMA & ENDPOINT ---
class OnboardingRequest(BaseModel):
    workspace_name: str  
    persona: str

@router.post("/onboard")
async def complete_onboarding(
    data: OnboardingRequest, 
    service: AuthService = Depends(get_auth_service),
    current_user: User = Depends(get_current_user)
):
    """Step 2: Workspace Creation & API Key Generation"""
    return await service.complete_onboarding(
        current_user=current_user,
        workspace_name=data.workspace_name,
        persona=data.persona
    )

# ---  PROFILE MANAGEMENT ---
@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_active_user),
    service: AuthService = Depends(get_auth_service)
):
    """Returns the current operative profile with attached workspace data."""
    return await service.get_user_profile(current_user=current_user)


class ProfileUpdateStrict(BaseModel):
    full_name: Optional[str] = None
    user_persona: Optional[str] = None

@router.patch("/me")
async def update_my_profile(
    update_data: ProfileUpdateStrict,
    service: AuthService = Depends(get_auth_service),
    current_user: User = Depends(get_current_user)
):
    """Allows operative to update their basic profile information."""
    return await service.update_profile(
        current_user=current_user,
        full_name=update_data.full_name,
        user_persona=update_data.user_persona
    )