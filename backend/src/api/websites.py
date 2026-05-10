from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ..database import get_db
from ..models import MonitoredWebsite, User
from ..schemas import MonitoredWebsiteCreate, MonitoredWebsiteResponse
from ..core.security import get_current_user

router = APIRouter(prefix="/websites", tags=["Monitored Websites"])

@router.get("/", response_model=List[MonitoredWebsiteResponse])
async def get_monitored_websites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all monitored websites for the current workspace."""
    result = await db.execute(
        select(MonitoredWebsite)
        .where(MonitoredWebsite.workspace_id == current_user.workspace_id)
        .order_by(MonitoredWebsite.created_at.desc())
    )
    return result.scalars().all()

@router.post("/", response_model=MonitoredWebsiteResponse, status_code=status.HTTP_201_CREATED)
async def create_monitored_website(
    website_in: MonitoredWebsiteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a new website to be monitored and routed through the IDS reverse proxy."""
    # Check if domain already exists in this workspace
    result = await db.execute(
        select(MonitoredWebsite)
        .where(
            MonitoredWebsite.domain == website_in.domain,
            MonitoredWebsite.workspace_id == current_user.workspace_id
        )
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="Website domain is already being monitored in this workspace."
        )

    new_website = MonitoredWebsite(
        domain=website_in.domain,
        target_ip=website_in.target_ip,
        target_port=website_in.target_port,
        workspace_id=current_user.workspace_id
    )
    db.add(new_website)
    await db.commit()
    await db.refresh(new_website)
    return new_website

@router.delete("/{website_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_monitored_website(
    website_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a monitored website."""
    result = await db.execute(
        select(MonitoredWebsite).where(
            MonitoredWebsite.id == website_id,
            MonitoredWebsite.workspace_id == current_user.workspace_id
        )
    )
    website = result.scalars().first()
    
    if not website:
        raise HTTPException(status_code=404, detail="Website not found.")
        
    await db.delete(website)
    await db.commit()
    return None
