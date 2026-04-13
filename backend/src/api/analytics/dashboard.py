from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...models import User
from ...core.security import get_current_active_user
from ...services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Dashboard Analytics"])

def get_analytics_service(db: AsyncSession = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(db)

@router.get("/overview")
async def get_dashboard_summary(
    service: AnalyticsService = Depends(get_analytics_service),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieves the overall security status for the main dashboard view."""
    return await service.get_dashboard_summary(workspace_id=current_user.workspace_id)