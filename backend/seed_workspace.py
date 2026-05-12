import asyncio
import os

from sqlalchemy import select, update

from src.database import AsyncSessionLocal
from src.core.security import get_password_hash
from src.models import MonitoredWebsite, User, Workspace


def env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


async def seed_workspace() -> None:
    sensor_key_path = os.getenv("SENSOR_KEY_FILE", "/var/log/snort/sensor_key")
    file_api_key = ""
    if os.path.exists(sensor_key_path):
        with open(sensor_key_path, "r", encoding="utf-8") as key_file:
            file_api_key = key_file.read().strip()

    api_key = file_api_key or os.getenv("SNORT_API_KEY") or os.getenv("API_KEY")
    if not api_key:
        print("[seed] No SNORT_API_KEY/API_KEY configured; skipping workspace seed.")
        return

    workspace_name = os.getenv("DEFAULT_WORKSPACE_NAME", "IDS Demo Workspace")
    demo_email = os.getenv("DEMO_ADMIN_EMAIL", "demo@wids.local").strip().lower()
    demo_password = os.getenv("DEMO_ADMIN_PASSWORD", "DemoPass123!")
    demo_full_name = os.getenv("DEMO_ADMIN_FULL_NAME", "W-IDS Demo Admin")
    enable_demo_admin = env_flag("ENABLE_DEMO_ADMIN", True)
    reset_demo_admin = env_flag("RESET_DEMO_ADMIN_PASSWORD", False)
    seed_demo_origin = env_flag("SEED_DEMO_ORIGIN", True)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Workspace).where(Workspace.api_key == api_key))
        workspace = result.scalars().first()

        if workspace is None:
            workspace = Workspace(name=workspace_name, api_key=api_key)
            db.add(workspace)
            await db.commit()
            await db.refresh(workspace)
            print(f"[seed] Created workspace {workspace.id} for configured sensor key.")
        else:
            print(f"[seed] Workspace {workspace.id} already exists for configured sensor key.")

        await db.execute(
            update(User)
            .where(User.workspace_id.is_(None))
            .values(workspace_id=workspace.id)
        )
        await db.commit()
        print(f"[seed] Assigned unassigned users to workspace {workspace.id}.")

        if enable_demo_admin:
            result = await db.execute(select(User).where(User.email == demo_email))
            demo_user = result.scalars().first()
            if demo_user is None:
                demo_user = User(
                    email=demo_email,
                    hashed_password=get_password_hash(demo_password),
                    full_name=demo_full_name,
                    role="admin",
                    is_active=True,
                    workspace_id=workspace.id,
                )
                db.add(demo_user)
                await db.commit()
                print(f"[seed] Created local demo admin {demo_email}.")
            elif reset_demo_admin:
                demo_user.hashed_password = get_password_hash(demo_password)
                demo_user.is_active = True
                demo_user.role = "admin"
                demo_user.workspace_id = workspace.id
                await db.commit()
                print(f"[seed] Reset local demo admin {demo_email}.")
            else:
                print(f"[seed] Demo admin {demo_email} already exists; password left unchanged.")

        if seed_demo_origin:
            domain = os.getenv("DEMO_ORIGIN_DOMAIN", "app.example.com").strip().lower()
            target = os.getenv("DEMO_ORIGIN_TARGET", "demo-origin").strip()
            target_port = int(os.getenv("DEMO_ORIGIN_PORT", "8081"))
            listen_port = int(os.getenv("DEMO_ORIGIN_LISTEN_PORT", "80"))
            result = await db.execute(
                select(MonitoredWebsite).where(
                    MonitoredWebsite.workspace_id == workspace.id,
                    MonitoredWebsite.domain == domain,
                )
            )
            site = result.scalars().first()
            if site is None:
                site = MonitoredWebsite(
                    domain=domain,
                    target_ip=target,
                    target_port=target_port,
                    scheme="http",
                    public_hostname=domain,
                    listen_port=listen_port,
                    tls_mode="edge",
                    proxy_mode="reverse_proxy",
                    health_path="/",
                    is_active=True,
                    workspace_id=workspace.id,
                )
                db.add(site)
                await db.commit()
                print(f"[seed] Registered demo origin {domain} -> {target}:{target_port}.")
            else:
                print(f"[seed] Demo origin {domain} already registered.")

        try:
            from src.api.admin import (
                SNORT_PROFILE_PATH,
                atomic_write,
                refresh_custom_signatures,
                refresh_proxy_config,
                write_sensor_key,
            )
            from src.api.defense import sync_nginx_blacklist

            write_sensor_key(api_key)
            atomic_write(SNORT_PROFILE_PATH, f"{workspace.detection_profile or 'web-official'}\n")
            await refresh_proxy_config(db)
            await refresh_custom_signatures(db)
            await sync_nginx_blacklist(db)
            print("[seed] Refreshed generated proxy config, blacklist, and custom signature file.")
        except Exception as exc:
            print(f"[seed] Could not refresh runtime config files: {exc}")


if __name__ == "__main__":
    asyncio.run(seed_workspace())
