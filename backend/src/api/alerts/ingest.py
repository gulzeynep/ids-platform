from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from src.database import get_db
from src.models import Workspace
from src.schemas import AlertCreate, AlertResponse
from src.services.alert_service import AlertService

router = APIRouter()

# Define the expected header for the sensor
API_KEY_NAME = "X-Sensor-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

# ---------------------------------------------------------
# Dependencies
# ---------------------------------------------------------

async def get_workspace_by_api_key(
    api_key: str = Security(api_key_header),
    db: AsyncSession = Depends(get_db)
) -> Workspace:
    """
    Validates the sensor's API Key and returns the associated Workspace.
    """
    query = select(Workspace).where(Workspace.api_key == api_key)
    result = await self.db.execute(query)
    workspace = result.scalar_one_or_none()
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing Sensor API Key."
        )
    return workspace

def get_alert_service(db: AsyncSession = Depends(get_db)) -> AlertService:
    return AlertService(db)

# ---------------------------------------------------------
# Endpoints
# ---------------------------------------------------------

@router.post("/", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def ingest_alert(
    alert_in: AlertCreate,
    workspace: Workspace = Depends(get_workspace_by_api_key),
    service: AlertService = Depends(get_alert_service)
):
    """
    Endpoint for W-IDS Sensors to report new threats.
    Requires 'X-Sensor-API-Key' in headers.
    """
    try:
        new_alert = await service.create_alert(
            alert_data=alert_in, 
            workspace_id=workspace.id
        )
        return new_alert
    except Exception as e:
        # TODO: Add proper logging mechanism here
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process the incoming alert payload."
        )

@router.get("/recent", response_model=List[AlertResponse])
async def fetch_recent_alerts(
    workspace: Workspace = Depends(get_workspace_by_api_key),
    service: AlertService = Depends(get_alert_service)
):
    """
    Endpoint for Dashboard to fetch latest alerts.
    """
    alerts = await service.get_recent_alerts(workspace_id=workspace.id)
    return alerts