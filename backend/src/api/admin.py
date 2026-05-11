from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from src.database import get_db
from src.models import MonitoredWebsite, User, Workspace
from src.schemas import (
    MonitoredWebsiteCreate,
    MonitoredWebsiteResponse,
    UserResponse,
    WorkspaceResponse,
    UserRegister,
)
from src.core.security import get_current_user, get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin Panel"])


def website_response(site: MonitoredWebsite) -> MonitoredWebsiteResponse:
    host = site.public_hostname or site.domain
    upstream = f"{site.scheme}://{site.target_ip}:{site.target_port}"
    server_block = (
        "server {\n"
        f"    listen {site.listen_port};\n"
        f"    server_name {host};\n"
        "    location / {\n"
        f"        proxy_pass {upstream};\n"
        "        proxy_set_header Host $host;\n"
        "        proxy_set_header X-Real-IP $remote_addr;\n"
        "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n"
        "    }\n"
        "}"
    )
    return MonitoredWebsiteResponse(
        id=site.id,
        domain=site.domain,
        target_ip=site.target_ip,
        target_port=site.target_port,
        scheme=site.scheme,
        public_hostname=site.public_hostname,
        listen_port=site.listen_port,
        tls_mode=site.tls_mode,
        proxy_mode=site.proxy_mode,
        health_path=site.health_path,
        is_active=bool(site.is_active),
        created_at=site.created_at,
        workspace_id=site.workspace_id,
        proxy_url=f"http://{host}:{site.listen_port}",
        dns_target=f"{host}:{site.listen_port}",
        nginx_server_block=server_block,
    )

async def require_system_admin(current_user: User = Depends(get_current_user)):
    """Clearance check to ensure only system admins can see global platform data."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized"
        )
    return current_user

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    admin_user: User = Depends(require_system_admin), 
    db: AsyncSession = Depends(get_db)
):
    """GLOBAL ADMIN: Fetch all operatives registered on the W-IDS platform."""
    result = await db.execute(select(User))
    return result.scalars().all()

@router.get("/workspaces", response_model=List[WorkspaceResponse])
async def get_all_workspaces(
    admin_user: User = Depends(require_system_admin), 
    db: AsyncSession = Depends(get_db)
):
    """GLOBAL ADMIN: Fetch all active isolated workspaces/tenants."""
    result = await db.execute(select(Workspace))
    return result.scalars().all()

@router.get("/team", response_model=List[UserResponse])
async def get_workspace_team(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all operatives assigned to the current workspace."""
    result = await db.execute(
        select(User).where(User.workspace_id == current_user.workspace_id)
    )
    return result.scalars().all()

@router.post("/team/add", status_code=status.HTTP_201_CREATED)
async def add_team_member(
    user_in: UserRegister, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ADMIN ONLY: Deploy a new operative to the current workspace."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. Administrative clearance required."
        )

    # Check for existing email
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Operative already exists.")

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        workspace_id=current_user.workspace_id,
        role="analyst",  # New members default to Analyst
        is_active=True
    )
    
    db.add(new_user)
    await db.commit()
    return {"message": "New operative successfully deployed."}

@router.patch("/team/{user_id}/grant-access")
async def grant_operative_access(
    user_id: int,
    new_role: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_system_admin)
):
    """Allows Admin to upgrade/downgrade an operative's clearance level."""
    result = await db.execute(select(User).where(User.id == user_id, User.workspace_id == admin_user.workspace_id))
    user_to_update = result.scalars().first()
    
    if not user_to_update:
        raise HTTPException(status_code=404, detail="Operative not found in this workspace.")
        
    user_to_update.role = new_role
    await db.commit()
    return {"message": f"Access granted as {new_role}."}

@router.patch("/team/{user_id}/toggle-access")
async def toggle_operative_access(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Kullanıcıyı bul
    result = await db.execute(
        select(User).where(User.id == user_id, User.workspace_id == current_user.workspace_id)
    )
    user_to_update = result.scalars().first()
    
    if not user_to_update:
        raise HTTPException(status_code=404, detail="Operative not found.")

    # 2. DURUMU DEĞİŞTİR (En kritik kısım)
    user_to_update.is_active = not user_to_update.is_active
    
    # 3. ZORLA KAYDET
    await db.merge(user_to_update) # Nesneyi session'a tekrar bağla
    await db.commit() # Değişikliği kalıcı yap
    
    return {"message": "Success", "new_status": user_to_update.is_active}


@router.get("/protected-sites", response_model=List[MonitoredWebsiteResponse])
async def list_protected_sites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MonitoredWebsite)
        .where(MonitoredWebsite.workspace_id == current_user.workspace_id)
        .order_by(MonitoredWebsite.created_at.desc())
    )
    return [website_response(site) for site in result.scalars().all()]


@router.post("/protected-sites", response_model=MonitoredWebsiteResponse, status_code=status.HTTP_201_CREATED)
async def create_protected_site(
    site_in: MonitoredWebsiteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrative clearance required.")

    existing = await db.execute(
        select(MonitoredWebsite).where(
            MonitoredWebsite.workspace_id == current_user.workspace_id,
            MonitoredWebsite.domain == site_in.domain,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="This domain is already protected in this workspace.")

    site = MonitoredWebsite(
        domain=site_in.domain,
        target_ip=site_in.target_ip,
        target_port=site_in.target_port,
        scheme=site_in.scheme,
        public_hostname=site_in.public_hostname,
        listen_port=site_in.listen_port,
        tls_mode=site_in.tls_mode,
        proxy_mode=site_in.proxy_mode,
        health_path=site_in.health_path,
        workspace_id=current_user.workspace_id,
        is_active=True,
    )
    db.add(site)
    await db.commit()
    await db.refresh(site)
    return website_response(site)


@router.patch("/protected-sites/{site_id}/toggle", response_model=MonitoredWebsiteResponse)
async def toggle_protected_site(
    site_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrative clearance required.")

    result = await db.execute(
        select(MonitoredWebsite).where(
            MonitoredWebsite.id == site_id,
            MonitoredWebsite.workspace_id == current_user.workspace_id,
        )
    )
    site = result.scalars().first()
    if not site:
        raise HTTPException(status_code=404, detail="Protected site not found.")

    site.is_active = not site.is_active
    await db.commit()
    await db.refresh(site)
    return website_response(site)
