import asyncio
import os

from sqlalchemy import select, update

from src.database import AsyncSessionLocal
from src.models import User, Workspace


async def seed_workspace() -> None:
    api_key = os.getenv("SNORT_API_KEY") or os.getenv("API_KEY")
    if not api_key:
        print("[seed] No SNORT_API_KEY/API_KEY configured; skipping workspace seed.")
        return

    workspace_name = os.getenv("DEFAULT_WORKSPACE_NAME", "IDS Demo Workspace")

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


if __name__ == "__main__":
    asyncio.run(seed_workspace())
