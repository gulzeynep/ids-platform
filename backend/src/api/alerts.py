import os 
from dotenv import load_dotenv 

from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security.api_key import APIKeyHeader
from fastapi.security import OAuth2PasswordBearer

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from typing import List

from backend.src.database import get_db
from backend.src.models import Alert, User
from backend.src.schemas import AlertCreate, AlertDisplay
from backend.src.api.auth import get_current_admin_user
from backend.src.core.logger import logger
from backend.src.core.queue import add_to_queue

load_dotenv
API_KEY = os.getenv("API_KEY")
api_key_header = APIKeyHeader(name="X-IDS-KEY", auto_error=True)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")
router = APIRouter(prefix="/alerts", tags=["Alert Management"])

async def get_api_key(api_key_header:str = Security(api_key_header)):
    if api_key_header ==API_KEY:
        return api_key_header
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Could not validate API Key",
    )
async def validate_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        logger.warning("Invalid API Key attempt")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate API Key"
        )
    return api_key

async def get_user_by_api_key(api_key: str, db: AsyncSession):
    query =  select(User).where(User.api_key == api_key)
    result = await db.execute(query)
    return result.scalars().first()

#router endpoints for alert management and engine upload 

@router.get("/", response_model=List[AlertDisplay])
async def get_alerts(token: str= Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).order_by(Alert.timestamp.desc()))
    return result.scalars().all()

@router.post("/", response_model=List[AlertDisplay])
async def create_alert(alert: AlertCreate, 
                       db: AsyncSession = Depends(get_db)
                       ):
    db_alert = Alert(**alert.model_dump())
    db.add(db_alert)
    await db.commit()
    await db.refresh(db_alert)
    return db_alert

@router.get("/{alert_id}")
async def get_alert(alert_id: int, 
                    db: AsyncSession = Depends(get_db)
                    ):
    result = await db.get(Alert, alert_id)
    if not result:
        raise HTTPException(status_code=404, detail="Alarm not found")
    return result

@router.delete("/{alert_id}")
async def delete_alert(alert_id: int, 
                       db: AsyncSession = Depends(get_db), 
                       admin_user=Depends(get_current_admin_user)
                       ):
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alarm not found")
    
    await db.delete(alert)
    await db.commit()
    return {"message": f"ID {alert_id} is successfuly deleted"}

@router.post("/engine-upload")
async def engine_upload_alert(
    alert:AlertCreate,
    db: AsyncSession = Depends(get_db),
    api_key: str = Depends(get_api_key)
):
    new_alert = Alert(**alert.model_dump())
    db.add(new_alert)
    await db.commit()
    return{"status": "success", "message": "Alert uploaded successfully"}
    
@router.post("/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_alert(
    alert: AlertCreate,
    api_key : str = Security(api_key_header),
    db: AsyncSession = Depends(get_db)
):
    print(f"DEBUG: received alert: {alert}")
    logger.info(f" NEW ALERT: {alert.type} from {alert.source_ip}")

    user = await get_user_by_api_key(api_key, db)
    if not user:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    
    alert_dict = alert.model_dump()
    alert_dict["owner_id"] = user.id 

    add_to_queue(alert_dict)
    return {"status": "accepted",
            "client": user.company_name}