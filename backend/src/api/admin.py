import json
import os
import re
import secrets
from pathlib import Path
from typing import List

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_current_user, get_password_hash
from src.database import get_db
from src.models import DetectionRule, MonitoredWebsite, User, Workspace
from src.schemas import (
    DetectionProfileResponse,
    DetectionProfileUpdate,
    DetectionRuleCreate,
    DetectionRuleResponse,
    DetectionRuleUpdate,
    MonitoredWebsiteCreate,
    MonitoredWebsiteResponse,
    MonitoredWebsiteUpdate,
    SensorKeyResponse,
    UserRegister,
    UserResponse,
    WorkspaceResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

PROXY_CONFIG_PATH = Path(os.getenv("NGINX_PROTECTED_SITES_CONF", "/etc/nginx/generated/protected-sites.conf"))
NGINX_CERTS_DIR = Path(os.getenv("NGINX_CERTS_DIR", "/etc/nginx/certs"))
CUSTOM_SIGNATURES_PATH = Path(os.getenv("CUSTOM_WEB_SIGNATURES_PATH", "/var/log/snort/custom_web_signatures.json"))
CUSTOM_SNORT_RULES_PATH = Path(os.getenv("CUSTOM_SNORT_RULES_PATH", "/etc/snort/rules/local/workspace.rules"))
BLACKLIST_CONFIG_PATH = Path(os.getenv("NGINX_BLOCKED_IPS_CONF", "/etc/nginx/generated/blocked-ips.conf"))
SNORT_PROFILE_PATH = Path(os.getenv("SNORT_PROFILE_PATH", "/var/log/snort/detection_profile"))
SNORT_RELOAD_REQUEST_PATH = Path(os.getenv("SNORT_RELOAD_REQUEST_PATH", "/var/log/snort/reload_snort"))
SENSOR_KEY_PATH = Path(os.getenv("SENSOR_KEY_FILE", "/var/log/snort/sensor_key"))
AVAILABLE_PROFILES = ["web-official", "web-balanced", "web-full", "local-only"]
SAFE_HOST_RE = re.compile(r"^[A-Za-z0-9._-]+$")
SNORT_SID_RE = re.compile(r"\bsid\s*:\s*(\d+)\s*;", re.IGNORECASE)
SNORT_REV_RE = re.compile(r"\brev\s*:\s*(\d+)\s*;", re.IGNORECASE)
SNORT_MSG_RE = re.compile(r'\bmsg\s*:\s*"([^"]+)"\s*;', re.IGNORECASE)
LOCAL_SNORT_SID_MIN = 1_000_000


def require_safe_host(value: str, field_name: str) -> str:
    cleaned = value.strip().lower().replace("https://", "").replace("http://", "").strip("/")
    if not cleaned or not SAFE_HOST_RE.match(cleaned):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}.")
    return cleaned


def normalize_health_path(path: str) -> str:
    cleaned = (path or "/").strip()
    return cleaned if cleaned.startswith("/") else f"/{cleaned}"


def site_hosts(site: MonitoredWebsite) -> list[str]:
    hosts = [site.domain]
    if site.public_hostname and site.public_hostname not in hosts:
        hosts.append(site.public_hostname)
    return hosts


def cert_paths_for_host(host: str) -> tuple[Path, Path]:
    return NGINX_CERTS_DIR / host / "fullchain.pem", NGINX_CERTS_DIR / host / "privkey.pem"


def tls_status(site: MonitoredWebsite) -> str:
    if site.tls_mode == "passthrough":
        return "passthrough_metadata_only"
    if site.tls_mode == "origin":
        return "origin_tls"

    cert, key = cert_paths_for_host(site.public_hostname or site.domain)
    return "active" if cert.exists() and key.exists() else "pending_certificate"


def render_location_block(site: MonitoredWebsite) -> str:
    upstream = f"{site.scheme}://{site.target_ip}:{site.target_port}"
    return (
        "    location / {\n"
        "        include /etc/nginx/generated/blocked-ips.conf;\n"
        f"        proxy_pass {upstream};\n"
        "        proxy_http_version 1.1;\n"
        "        proxy_set_header Host $host;\n"
        "        proxy_set_header X-Real-IP $remote_addr;\n"
        "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n"
        "        proxy_set_header X-Forwarded-Proto $scheme;\n"
        "        proxy_set_header Upgrade $http_upgrade;\n"
        "        proxy_set_header Connection \"upgrade\";\n"
        "        proxy_connect_timeout 5s;\n"
        "        proxy_read_timeout 60s;\n"
        "    }\n"
    )


def render_nginx_server_block(site: MonitoredWebsite) -> str:
    server_name = " ".join(site_hosts(site))
    http_block = (
        "server {\n"
        f"    listen {site.listen_port};\n"
        f"    server_name {server_name};\n"
        f"{render_location_block(site)}"
        "}\n"
    )

    if tls_status(site) != "active":
        return http_block

    cert_host = site.public_hostname or site.domain
    tls_block = (
        "server {\n"
        "    listen 443 ssl;\n"
        f"    server_name {server_name};\n"
        f"    ssl_certificate /etc/nginx/certs/{cert_host}/fullchain.pem;\n"
        f"    ssl_certificate_key /etc/nginx/certs/{cert_host}/privkey.pem;\n"
        f"{render_location_block(site)}"
        "}\n"
    )
    return f"{http_block}\n{tls_block}"


def atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(f"{path.suffix}.tmp")
    tmp_path.write_text(content, encoding="utf-8")
    os.replace(tmp_path, path)


def write_sensor_key(api_key: str) -> None:
    atomic_write(SENSOR_KEY_PATH, f"{api_key}\n")


def read_engine_profile() -> str:
    if SNORT_PROFILE_PATH.exists():
        profile = SNORT_PROFILE_PATH.read_text(encoding="utf-8").strip()
        if profile in AVAILABLE_PROFILES:
            return profile
    return "web-official"


def write_engine_profile(profile: str) -> None:
    atomic_write(SNORT_PROFILE_PATH, f"{profile}\n")
    atomic_write(SNORT_RELOAD_REQUEST_PATH, f"{profile}\n")


def request_snort_reload(reason: str = "custom-rules") -> None:
    atomic_write(SNORT_RELOAD_REQUEST_PATH, f"{reason}\n")


async def refresh_proxy_config(db: AsyncSession) -> None:
    result = await db.execute(
        select(MonitoredWebsite)
        .where(MonitoredWebsite.is_active.is_(True))
        .order_by(MonitoredWebsite.workspace_id, MonitoredWebsite.domain)
    )
    sites = result.scalars().all()
    rendered = [
        "# Generated by W-IDS. Edit protected sites from the Management panel.\n",
        "# This file is watched by the gateway container and reloaded after nginx -t passes.\n\n",
    ]
    if not sites:
        rendered.append("# No active protected sites.\n")
    for site in sites:
        rendered.append(render_nginx_server_block(site))
        rendered.append("\n")
    if not BLACKLIST_CONFIG_PATH.exists():
        atomic_write(BLACKLIST_CONFIG_PATH, "# Generated by W-IDS Defense.\nallow all;\n")
    atomic_write(PROXY_CONFIG_PATH, "".join(rendered))


async def refresh_custom_signatures(db: AsyncSession) -> None:
    result = await db.execute(
        select(DetectionRule)
        .where(DetectionRule.enabled.is_(True))
        .where(DetectionRule.match_type != "snort")
        .order_by(DetectionRule.workspace_id, DetectionRule.id)
    )
    rules = [
        {
            "id": rule.id,
            "workspace_id": rule.workspace_id,
            "title": rule.title,
            "severity": rule.severity,
            "category": rule.category,
            "match_type": rule.match_type,
            "pattern": rule.pattern,
            "enabled": bool(rule.enabled),
        }
        for rule in result.scalars().all()
    ]
    atomic_write(CUSTOM_SIGNATURES_PATH, json.dumps(rules, ensure_ascii=True, indent=2))


def parse_snort_sid(rule_text: str) -> int | None:
    match = SNORT_SID_RE.search(rule_text)
    return int(match.group(1)) if match else None


def parse_snort_msg(rule_text: str) -> str | None:
    match = SNORT_MSG_RE.search(rule_text)
    return match.group(1).strip() if match else None


async def validate_custom_snort_rule(
    db: AsyncSession,
    rule_text: str,
    workspace_id: int,
    exclude_rule_id: int | None = None,
) -> str:
    cleaned = rule_text.strip()
    if "\n" in cleaned or "\r" in cleaned:
        raise HTTPException(status_code=400, detail="Snort rule must be a single line.")
    if not cleaned.lower().startswith("alert "):
        raise HTTPException(status_code=400, detail="Custom Snort rules must use the alert action.")
    if "(" not in cleaned or not cleaned.endswith(")"):
        raise HTTPException(status_code=400, detail="Snort rule must contain an option block wrapped in parentheses.")
    if not SNORT_MSG_RE.search(cleaned):
        raise HTTPException(status_code=400, detail='Snort rule must include msg:"...";')
    sid = parse_snort_sid(cleaned)
    if sid is None:
        raise HTTPException(status_code=400, detail="Snort rule must include sid:<number>;")
    if sid < LOCAL_SNORT_SID_MIN:
        raise HTTPException(status_code=400, detail="Custom Snort rule SID must be 1000000 or higher.")
    if not SNORT_REV_RE.search(cleaned):
        raise HTTPException(status_code=400, detail="Snort rule must include rev:<number>;")

    result = await db.execute(
        select(DetectionRule)
        .where(DetectionRule.workspace_id == workspace_id)
        .where(DetectionRule.match_type == "snort")
    )
    for existing in result.scalars().all():
        if exclude_rule_id is not None and existing.id == exclude_rule_id:
            continue
        if parse_snort_sid(existing.pattern) == sid:
            raise HTTPException(status_code=400, detail=f"SID {sid} is already used by another custom rule.")

    return cleaned


async def refresh_custom_snort_rules(db: AsyncSession) -> None:
    result = await db.execute(
        select(DetectionRule)
        .where(DetectionRule.enabled.is_(True))
        .where(DetectionRule.match_type == "snort")
        .order_by(DetectionRule.workspace_id, DetectionRule.id)
    )
    rendered = [
        "# Generated by LynxGate. Edit from Defense > Custom Snort Rules.\n",
        "# User-managed rules are kept separate from official Snort rules.\n\n",
    ]
    for rule in result.scalars().all():
        sid = parse_snort_sid(rule.pattern)
        label = parse_snort_msg(rule.pattern) or rule.title
        if sid is None:
            rendered.append(f"# skipped invalid rule id={rule.id} title={rule.title!r}\n")
            continue
        rendered.append(f"# workspace={rule.workspace_id} rule={rule.id} sid={sid} msg={label}\n")
        rendered.append(f"{rule.pattern.strip()}\n")

    atomic_write(CUSTOM_SNORT_RULES_PATH, "".join(rendered))
    request_snort_reload()


async def refresh_detection_rule_outputs(db: AsyncSession) -> None:
    await refresh_custom_signatures(db)
    await refresh_custom_snort_rules(db)


def website_response(site: MonitoredWebsite, upstream_health: str = "not_checked") -> MonitoredWebsiteResponse:
    host = site.public_hostname or site.domain
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
        nginx_server_block=render_nginx_server_block(site),
        tls_status=tls_status(site),
        upstream_health=upstream_health,
    )


async def require_system_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )
    return current_user


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    admin_user: User = Depends(require_system_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User))
    return result.scalars().all()


@router.get("/workspaces", response_model=List[WorkspaceResponse])
async def get_all_workspaces(
    admin_user: User = Depends(require_system_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Workspace))
    return result.scalars().all()


@router.get("/sensor-key", response_model=SensorKeyResponse)
async def get_sensor_key(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Workspace).where(Workspace.id == current_user.workspace_id))
    workspace = result.scalars().first()
    if not workspace or not workspace.api_key:
        raise HTTPException(status_code=404, detail="Workspace sensor key not found.")
    write_sensor_key(workspace.api_key)
    return SensorKeyResponse(
        api_key=workspace.api_key,
        workspace_id=workspace.id,
        key_file=str(SENSOR_KEY_PATH),
    )


@router.post("/sensor-key/rotate", response_model=SensorKeyResponse)
async def rotate_sensor_key(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrative clearance required.")

    result = await db.execute(select(Workspace).where(Workspace.id == current_user.workspace_id))
    workspace = result.scalars().first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    workspace.api_key = f"wids_{secrets.token_urlsafe(32)}"
    await db.commit()
    await db.refresh(workspace)
    write_sensor_key(workspace.api_key)
    return SensorKeyResponse(
        api_key=workspace.api_key,
        workspace_id=workspace.id,
        key_file=str(SENSOR_KEY_PATH),
    )


@router.get("/team", response_model=List[UserResponse])
async def get_workspace_team(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.workspace_id == current_user.workspace_id))
    return result.scalars().all()


@router.post("/team/add", status_code=status.HTTP_201_CREATED)
async def add_team_member(
    user_in: UserRegister,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrative clearance required.",
        )

    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Operative already exists.")

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        workspace_id=current_user.workspace_id,
        role=user_in.role if user_in.role in {"admin", "analyst", "viewer"} else "analyst",
        is_active=True,
    )

    db.add(new_user)
    await db.commit()
    return {"message": "New operative successfully deployed."}


@router.patch("/team/{user_id}/grant-access")
async def grant_operative_access(
    user_id: int,
    new_role: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_system_admin),
):
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
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(User).where(User.id == user_id, User.workspace_id == current_user.workspace_id)
    )
    user_to_update = result.scalars().first()

    if not user_to_update:
        raise HTTPException(status_code=404, detail="Operative not found.")

    user_to_update.is_active = not user_to_update.is_active
    await db.merge(user_to_update)
    await db.commit()

    return {"message": "Success", "new_status": user_to_update.is_active}


@router.get("/protected-sites", response_model=List[MonitoredWebsiteResponse])
async def list_protected_sites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await refresh_proxy_config(db)
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

    domain = require_safe_host(site_in.domain, "domain")
    target_ip = require_safe_host(site_in.target_ip, "target_ip")
    public_hostname = require_safe_host(site_in.public_hostname, "public_hostname") if site_in.public_hostname else None

    existing = await db.execute(
        select(MonitoredWebsite).where(
            MonitoredWebsite.workspace_id == current_user.workspace_id,
            MonitoredWebsite.domain == domain,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="This domain is already protected in this workspace.")

    site = MonitoredWebsite(
        domain=domain,
        target_ip=target_ip,
        target_port=site_in.target_port,
        scheme=site_in.scheme,
        public_hostname=public_hostname,
        listen_port=site_in.listen_port,
        tls_mode=site_in.tls_mode,
        proxy_mode=site_in.proxy_mode,
        health_path=normalize_health_path(site_in.health_path),
        workspace_id=current_user.workspace_id,
        is_active=True,
    )
    db.add(site)
    await db.commit()
    await db.refresh(site)
    await refresh_proxy_config(db)
    return website_response(site)


@router.patch("/protected-sites/{site_id}", response_model=MonitoredWebsiteResponse)
async def update_protected_site(
    site_id: int,
    site_in: MonitoredWebsiteUpdate,
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

    update_data = site_in.model_dump(exclude_unset=True)
    if "domain" in update_data and update_data["domain"]:
        update_data["domain"] = require_safe_host(update_data["domain"], "domain")
    if "target_ip" in update_data and update_data["target_ip"]:
        update_data["target_ip"] = require_safe_host(update_data["target_ip"], "target_ip")
    if "public_hostname" in update_data and update_data["public_hostname"]:
        update_data["public_hostname"] = require_safe_host(update_data["public_hostname"], "public_hostname")
    if "health_path" in update_data:
        update_data["health_path"] = normalize_health_path(update_data["health_path"])
    for port_field in ("target_port", "listen_port"):
        if port_field in update_data and update_data[port_field] is not None:
            if update_data[port_field] < 1 or update_data[port_field] > 65535:
                raise HTTPException(status_code=400, detail=f"Invalid {port_field}.")
    if "scheme" in update_data and update_data["scheme"] not in {"http", "https"}:
        raise HTTPException(status_code=400, detail="Invalid scheme.")
    if "tls_mode" in update_data and update_data["tls_mode"] not in {"edge", "passthrough", "origin"}:
        raise HTTPException(status_code=400, detail="Invalid tls_mode.")

    for key, value in update_data.items():
        setattr(site, key, value)

    await db.commit()
    await db.refresh(site)
    await refresh_proxy_config(db)
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
    await refresh_proxy_config(db)
    return website_response(site)


@router.post("/protected-sites/{site_id}/healthcheck", response_model=MonitoredWebsiteResponse)
async def healthcheck_protected_site(
    site_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MonitoredWebsite).where(
            MonitoredWebsite.id == site_id,
            MonitoredWebsite.workspace_id == current_user.workspace_id,
        )
    )
    site = result.scalars().first()
    if not site:
        raise HTTPException(status_code=404, detail="Protected site not found.")

    upstream = f"{site.scheme}://{site.target_ip}:{site.target_port}{site.health_path}"
    try:
        async with httpx.AsyncClient(follow_redirects=False) as client:
            response = await client.get(upstream, headers={"Host": site.domain}, timeout=5.0)
        health = "healthy" if response.status_code < 500 else f"unhealthy_http_{response.status_code}"
    except Exception:
        health = "unreachable"

    return website_response(site, upstream_health=health)


@router.delete("/protected-sites/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_protected_site(
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

    await db.delete(site)
    await db.commit()
    await refresh_proxy_config(db)
    return None


@router.get("/detection-rules", response_model=List[DetectionRuleResponse])
async def list_detection_rules(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await refresh_custom_signatures(db)
    if not CUSTOM_SNORT_RULES_PATH.exists():
        await refresh_custom_snort_rules(db)
    result = await db.execute(
        select(DetectionRule)
        .where(DetectionRule.workspace_id == current_user.workspace_id)
        .order_by(DetectionRule.created_at.desc())
    )
    return result.scalars().all()


@router.post("/detection-rules", response_model=DetectionRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_detection_rule(
    rule_in: DetectionRuleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrative clearance required.")

    rule_data = rule_in.model_dump()
    if rule_data["match_type"] == "snort":
        rule_data["pattern"] = await validate_custom_snort_rule(
            db,
            rule_data["pattern"],
            current_user.workspace_id,
        )
        rule_data["category"] = rule_data["category"] or "Custom Snort"
        rule_data["title"] = rule_data["title"] or parse_snort_msg(rule_data["pattern"]) or "Custom Snort Rule"

    rule = DetectionRule(**rule_data, workspace_id=current_user.workspace_id)
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    await refresh_detection_rule_outputs(db)
    return rule


@router.patch("/detection-rules/{rule_id}", response_model=DetectionRuleResponse)
async def update_detection_rule(
    rule_id: int,
    rule_in: DetectionRuleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrative clearance required.")

    result = await db.execute(
        select(DetectionRule).where(
            DetectionRule.id == rule_id,
            DetectionRule.workspace_id == current_user.workspace_id,
        )
    )
    rule = result.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Detection rule not found.")

    merged = {
        "title": rule.title,
        "severity": rule.severity,
        "category": rule.category,
        "match_type": rule.match_type,
        "pattern": rule.pattern,
        "enabled": rule.enabled,
        **rule_in.model_dump(exclude_unset=True),
    }
    validated = DetectionRuleCreate(**merged)
    validated_data = validated.model_dump()
    if validated_data["match_type"] == "snort":
        validated_data["pattern"] = await validate_custom_snort_rule(
            db,
            validated_data["pattern"],
            current_user.workspace_id,
            exclude_rule_id=rule.id,
        )

    for key, value in validated_data.items():
        setattr(rule, key, value)

    await db.commit()
    await db.refresh(rule)
    await refresh_detection_rule_outputs(db)
    return rule


@router.delete("/detection-rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_detection_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrative clearance required.")

    result = await db.execute(
        select(DetectionRule).where(
            DetectionRule.id == rule_id,
            DetectionRule.workspace_id == current_user.workspace_id,
        )
    )
    rule = result.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Detection rule not found.")

    await db.delete(rule)
    await db.commit()
    await refresh_detection_rule_outputs(db)
    return None


@router.get("/detection-profile", response_model=DetectionProfileResponse)
async def get_detection_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Workspace).where(Workspace.id == current_user.workspace_id))
    workspace = result.scalars().first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found.")
    return DetectionProfileResponse(
        profile=workspace.detection_profile or "web-balanced",
        available_profiles=AVAILABLE_PROFILES,
        engine_profile=read_engine_profile(),
        reload_requested=SNORT_RELOAD_REQUEST_PATH.exists(),
    )


@router.patch("/detection-profile", response_model=DetectionProfileResponse)
async def update_detection_profile(
    profile_in: DetectionProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrative clearance required.")

    result = await db.execute(select(Workspace).where(Workspace.id == current_user.workspace_id))
    workspace = result.scalars().first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    workspace.detection_profile = profile_in.profile
    await db.commit()
    write_engine_profile(workspace.detection_profile)
    return DetectionProfileResponse(
        profile=workspace.detection_profile,
        available_profiles=AVAILABLE_PROFILES,
        engine_profile=read_engine_profile(),
        reload_requested=True,
    )
