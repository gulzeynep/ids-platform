from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
import json

from src.core.ws_manager import manager
from src.database import get_db
from src.models import User
from config import settings 

router = APIRouter(prefix="/ws", tags=["WebSockets"])

@router.websocket("")
async def websocket_endpoint(
    websocket: WebSocket, 
    db: AsyncSession = Depends(get_db)
):
    await websocket.accept()
    
    workspace_id = None 

    try:
        auth_message = await websocket.receive_text()
        auth_data = json.loads(auth_message)
        token = auth_data.get("token")
        
        if not token:
            await websocket.close(code=1008)
            return

        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        
        if not email:
            await websocket.close(code=1008) 
            return

        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        if not user or not user.is_active or not user.workspace_id:
            await websocket.close(code=1008)
            return

        workspace_id = user.workspace_id
        await manager.connect(websocket, workspace_id)

        while True: 
            data = await websocket.receive_text()

    except JWTError:
        await websocket.close(code=1008)
    except WebSocketDisconnect:
        if workspace_id:
            manager.disconnect(websocket, workspace_id)
    except Exception as e:
        if workspace_id:
            manager.disconnect(websocket, workspace_id)