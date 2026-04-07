import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# The URL must start with postgresql+asyncpg://
DATABASE_URL = os.getenv("DATABASE_URL")

# 1. Create the Async Engine
engine = create_async_engine(DATABASE_URL, echo=True)

# 2. Create the Async Session Local
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

# 3. The Dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session