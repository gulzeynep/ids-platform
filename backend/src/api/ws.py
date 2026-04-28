from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
import json

from ..core.ws_manager import manager
from ..database import get_db
from ..models import User

from config import Settings

router = APIRouter(prefix="/ws", tags=["WebSockets"])

SECRET_KEY = Settings.SECRET_KEY
ALGORITHM = Settings.ALGORITHM

@router.websocket("/stream")
async def websocket_endpoint(
    websocket: WebSocket, 
    db: AsyncSession = Depends(get_db)
):
    await websocket.accept()

    try:
        auth_message = await websocket.receive_text()
        auth_data = json.loads(auth_message)
        token = auth_data.get("token")
        
        if not token:
            await websocket.close(code=1008)

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        email: str = payload.get("sub")
        if not email:
            await websocket.close(code=1008) # 1008: Policy Violation
            return

        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        if not user or not user.is_active or not user.workspace_id:
            await websocket.close(code=1008)
            return

        workspace_id = user.workspace_id

        if workspace_id not in manager.active_connections:
            manager.active_connections[workspace_id] = []
        manager.active_connections[workspace_id].append(websocket)

        while True: 
            await websocket.receive_text()

    except JWTError:
        await websocket.close(code=1008)
    except WebSocketDisconnect:
        manager.disconnect(websocket, workspace_id)
