from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...models import User
from ...core.security import get_current_active_user
from ...services.analytics_service import AnalyticsService

router = APIRouter(prefix="/alerts/stats", tags=["Alert Statistics"])

def get_analytics_service(db: AsyncSession = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(db)

@router.get("/overview")
async def get_alert_stats(
    service: AnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieves high-level alert counts for the dashboard."""
    return await service.get_overview_stats(workspace_id=current_user.workspace_id)

@router.get("/analysis")
async def get_analysis_stats(
    service: AnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieves deep analytics including top attacker IPs and protocol breakdowns."""
    return await service.get_detailed_analysis(workspace_id=current_user.workspace_id)