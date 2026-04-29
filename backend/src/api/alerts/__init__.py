from fastapi import APIRouter

from src.api.alerts.ingest import router as ingest_router
from src.api.alerts.management import router as management_router
from src.api.alerts.stats import router as stats_router

router = APIRouter(prefix="/alerts", tags=["Alerts"])

# Assemble the sub-routers
router.include_router(ingest_router)
router.include_router(management_router)
router.include_router(stats_router)