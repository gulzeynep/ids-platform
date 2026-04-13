import secrets
from datetime import timedelta
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from ..models import User, Workspace
from ..schemas import UserRegister
from ..core.security import get_password_hash, verify_password, create_access_token

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_user(self, user_data: UserRegister) -> Dict[str, str]:
        result = await self.db.execute(select(User).where(User.email == user_data.email))
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="User already registered."
            )
        
        new_user = User(
            email=user_data.email, 
            hashed_password=get_password_hash(user_data.password)
        )
        self.db.add(new_user)
        await self.db.commit()
        return {"message": "Success"}

    async def authenticate_user(self, email: str, password: str) -> Dict[str, str]:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        token = create_access_token(data={"sub": user.email})
        return {"access_token": token, "token_type": "bearer"}

    async def complete_onboarding(self, current_user: User, workspace_name: str, persona: str) -> Dict[str, str]:
        if current_user.workspace_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Onboarding already complete."
            )
        
        # 1. Generate secure API key and create Workspace
        api_key = f"wids_live_{secrets.token_urlsafe(32)}"
        new_workspace = Workspace(
            name=workspace_name, 
            api_key=api_key 
        )
        self.db.add(new_workspace)
        await self.db.flush() 
        
        # 2. Bind the user to this new workspace
        current_user.workspace_id = new_workspace.id
        current_user.user_persona = persona
        
        await self.db.merge(current_user)
        await self.db.commit()

        return {
            "message": "Workspace initialized successfully.",
            "api_key": api_key
        }

    async def get_user_profile(self, current_user: User) -> Dict[str, Any]:
        workspace_name = "Pending Assignment"
        
        if current_user.workspace_id:
            ws_query = await self.db.execute(select(Workspace).where(Workspace.id == current_user.workspace_id))
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

    async def update_profile(self, current_user: User, full_name: Optional[str] = None, user_persona: Optional[str] = None) -> Dict[str, str]:
        if full_name is not None:
            current_user.full_name = full_name
        if user_persona is not None:
            current_user.user_persona = user_persona
            
        await self.db.commit()
        return {"message": "Profile updated successfully."}