import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.src.database import get_db
from backend.src.models import User
from backend.src.core.ws_manager import manager

router = APIRouter(prefix="/ws", tags=["WebSockets"])

# Güvenlik: Bağlanmaya çalışan kişinin token'ını kontrol et
async def get_user_from_token(token: str, db: AsyncSession) -> User:
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY", "super_gizli_jwt_anahtari"), algorithms=[os.getenv("ALGORITHM", "HS256")])
        email: str = payload.get("sub")
        if not email: return None
    except JWTError:
        return None
    
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

@router.websocket("/alerts")
async def websocket_alerts_endpoint(
    websocket: WebSocket, 
    token: str = Query(...), # Bağlanırken URL'den token alacağız (ws://.../alerts?token=ABC)
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_from_token(token, db)
    
    # Kimliksiz veya sahte token ile gelenleri kapı dışarı et
    if not user:
        await websocket.close(code=1008) 
        return
    
    company_id = user.company_id
    await manager.connect(websocket, company_id)
    
    try:
        while True:
            # Kanalı açık tutmak için bekleriz. Analist sayfayı kapatana kadar burası çalışır.
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, company_id)