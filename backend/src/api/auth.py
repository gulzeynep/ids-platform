import secrets
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Workspace
from ..schemas import UserRegister, UserProfileUpdate, UserResponse
from ..core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Step 1: Initial Registration.
    Only requires email and password. No workspace is created yet.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # Create new user
    hashed_pw = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_pw,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User registered successfully. Proceed to onboarding."}


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Standard OAuth2 Login. Returns a JWT access token.
    Frontend should send 'username' (which is the email) and 'password' as form data.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")

    # Generate JWT Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.put("/profile")
def complete_onboarding(
    profile_data: UserProfileUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Step 2: Onboarding Setup.
    Creates a dedicated Workspace, generates the API key, and links the user.
    """
    # 1. Check if user already has a workspace (prevent double onboarding)
    if current_user.workspace_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has already completed onboarding."
        )

    try:
        # 2. Create the completely isolated Workspace
        generated_api_key = f"wids_live_{secrets.token_urlsafe(32)}"
        
        new_workspace = Workspace(
            name=profile_data.company_name,
            subscription_plan=profile_data.plan,
            api_key=generated_api_key
        )
        
        db.add(new_workspace)
        db.flush() # Flushes to DB to get the new_workspace.id without full commit

        # 3. Update the current user with their persona and link them to the Workspace
        current_user.full_name = profile_data.full_name
        current_user.user_persona = profile_data.user_persona
        current_user.workspace_id = new_workspace.id
        
        db.commit()
        db.refresh(current_user)
        db.refresh(new_workspace)

        return {
            "message": "Operative profile and workspace initialized successfully.",
            "api_key": new_workspace.api_key
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database transaction failed: {str(e)}")


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Returns the currently logged-in user's data.
    Used by the frontend to populate the Profile page and check onboarding status.
    """
    return current_user