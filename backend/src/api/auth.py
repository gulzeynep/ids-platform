import secrets
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import User, Workspace
from ..schemas import UserRegister, UserProfileUpdate, UserResponse
from ..core.security import (
    get_password_hash, verify_password, create_access_token, 
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()

@router.post("/register", status_code=201)
async def register_user(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Step 1: Raw Registration"""
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="User already registered.")
    
    # Yeni bcrypt logic'imizi kullanıyor (security.py'de güncellediğimiz)
    new_user = User(
        email=user_data.email, 
        hashed_password=get_password_hash(user_data.password)
    )
    db.add(new_user)
    await db.commit()
    return {"message": "Success"}

@router.post("/token") # <-- LOGIN YERİNE TOKEN YAPTIK (Frontend 404 vermesin diye)
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

@router.put("/profile")
async def complete_onboarding(
    profile_data: UserProfileUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Step 2: Workspace Creation & API Key Generation"""
    if current_user.workspace_id:
        raise HTTPException(status_code=400, detail="Onboarding already complete.")
    
    # 1. Yeni Workspace oluştur
    api_key = f"wids_live_{secrets.token_urlsafe(32)}"
    new_ws = Workspace(
        name=profile_data.company_name, 
        subscription_plan=profile_data.plan, 
        api_key=api_key
    )
    db.add(new_ws)
    await db.flush() # ID almak için
    
    # 2. Kullanıcıyı bağla (AsyncSession'da objeyi session'a tekrar dahil etmeliyiz)
    current_user.workspace_id = new_ws.id
    current_user.user_persona = profile_data.user_persona
    
    # Bazı durumlarda current_user detached olabilir, merge ile garantiye alıyoruz
    await db.merge(current_user)
    await db.commit()
    
    return {
        "message": "Workspace initialized", 
        "api_key": api_key
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Current Operative Profile Status"""
    return current_user