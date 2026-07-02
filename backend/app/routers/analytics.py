from fastapi import APIRouter, Depends
from app.dependencies.deps import get_current_user
from app.services.analytics import AnalyticsService

router = APIRouter()

@router.get("/summary")
async def get_analytics_summary(current_user: str = Depends(get_current_user)):
    return await AnalyticsService.get_summary()
