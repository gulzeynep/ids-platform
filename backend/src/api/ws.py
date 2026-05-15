from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
import json

from src.core.logger import logger
from src.core.ws_manager import manager
from src.database import get_db
from src.models import User
from config import settings 

router = APIRouter(prefix="/ws", tags=["WebSockets"])
WS_POLICY_VIOLATION = 1008


async def close_policy_violation(websocket: WebSocket, reason: str) -> None:
    logger.warning("WebSocket authentication failed: %s", reason)
    await websocket.close(code=WS_POLICY_VIOLATION, reason=reason)

@router.websocket("")
async def websocket_endpoint(
    websocket: WebSocket, 
    db: AsyncSession = Depends(get_db)
):
    await websocket.accept()
    
    workspace_id = None 

    try:
        auth_message = await websocket.receive_text()
        try:
            auth_data = json.loads(auth_message)
        except json.JSONDecodeError:
            await close_policy_violation(websocket, "invalid_auth_payload")
            return

        token = auth_data.get("token")
        
        if not token:
            await close_policy_violation(websocket, "missing_token")
            return

        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        
        if not email:
            await close_policy_violation(websocket, "missing_subject")
            return

        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        if not user:
            await close_policy_violation(websocket, "user_not_found")
            return
        if not user.is_active:
            await close_policy_violation(websocket, "inactive_user")
            return
        if not user.workspace_id:
            await close_policy_violation(websocket, "missing_workspace")
            return

        workspace_id = user.workspace_id
        await manager.connect(websocket, workspace_id)

        while True: 
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                continue
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": message.get("timestamp")})

    except JWTError:
        await close_policy_violation(websocket, "invalid_token")
    except WebSocketDisconnect:
        if workspace_id:
            manager.disconnect(websocket, workspace_id)
    except Exception:
        if workspace_id:
            manager.disconnect(websocket, workspace_id)
        logger.exception("WebSocket connection failed unexpectedly.")
