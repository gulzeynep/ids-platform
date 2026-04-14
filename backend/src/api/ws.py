from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError

from ..core.ws_manager import manager
from ..core.security import SECRET_KEY, ALGORITHM
from ..database import get_db
from ..models import User

router = APIRouter(prefix="/ws", tags=["WebSockets"])

@router.websocket("/stream")
async def websocket_endpoint(
    websocket: WebSocket, 
    token: str = Query(...), 
    db: AsyncSession = Depends(get_db)
):
    # 1. Tüneli geçici olarak aç ama henüz veriye bağlama
    await websocket.accept()

    try:
        # 2. Token Şifresini Çöz
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            await websocket.close(code=1008) # 1008: Policy Violation
            return

        # 3. Veritabanından Kullanıcıyı ve Workspace ID'sini Bul
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        # Eğer kullanıcı yoksa, pasifse veya henüz şirketini (onboarding) kurmadıysa at!
        if not user or not user.is_active or not user.workspace_id:
            await websocket.close(code=1008)
            return

        workspace_id = user.workspace_id

        # 4. Güvenli Bağlantıyı Kaydet (Kullanıcının gerçek workspace_id'si ile)
        # ws_manager.py içindeki connect metodunda accept() varsa oradakini silmen gerekebilir,
        # ancak senin gönderdiğin koda göre ws_manager'da accept() vardı. 
        # NOT: Eğer ws_manager.py içinde `await websocket.accept()` varsa,
        # FastAPI "zaten açık olan tüneli tekrar açamazsın" hatası verir. 
        # Bu yüzden manager'a sadece listeye eklemesini söylüyoruz.
        if workspace_id not in manager.active_connections:
            manager.active_connections[workspace_id] = []
        manager.active_connections[workspace_id].append(websocket)

        # 5. Mesajları Dinle (Tüneli açık tut)
        while True: 
            await websocket.receive_text()
            
    except JWTError:
        # Token süresi dolmuş veya geçersiz
        await websocket.close(code=1008)
    except WebSocketDisconnect:
        # Kullanıcı sekmeyi kapattı
        manager.disconnect(websocket, workspace_id)