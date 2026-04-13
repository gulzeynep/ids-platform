from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Sequence, Dict, Any, Optional
from fastapi import HTTPException, status

from src.models import User, Workspace
from src.core.security import get_password_hash, verify_password

class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_users(self) -> Sequence[User]:
        result = await self.db.execute(select(User))
        return result.scalars().all()

    async def get_all_workspaces(self) -> Sequence[Workspace]:
        result = await self.db.execute(select(Workspace))
        return result.scalars().all()

    async def get_workspace_team(self, workspace_id: int) -> Sequence[User]:
        result = await self.db.execute(
            select(User).where(User.workspace_id == workspace_id)
        )
        return result.scalars().all()

    async def toggle_operative_status(self, user_id: int, workspace_id: int) -> Optional[Dict[str, Any]]:
        result = await self.db.execute(
            select(User).where(User.id == user_id, User.workspace_id == workspace_id)
        )
        user = result.scalars().first()
        
        if not user:
            return None

        user.is_active = not user.is_active
        await self.db.commit()

        status_text = "Active" if user.is_active else "Suspended"
        return {
            "message": f"Operative status updated to {status_text}.", 
            "new_status": user.is_active
        }

    async def reset_operative_password(
        self, user_id: int, workspace_id: int, current_admin: User, 
        new_password: str, admin_confirm_password: str
    ) -> bool:
        
        if not verify_password(admin_confirm_password, current_admin.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Admin authorization failed. Incorrect confirmation password."
            )

        result = await self.db.execute(
            select(User).where(User.id == user_id, User.workspace_id == workspace_id)
        )
        user = result.scalars().first()
        
        if not user:
            return False

        user.hashed_password = get_password_hash(new_password)
        await self.db.commit()
        return True