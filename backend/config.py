from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT_ENV = BACKEND_DIR.parent / ".env"
BACKEND_LOCAL_ENV = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "W-IDS Platform"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str
    
    # Auth & Security
    API_KEY: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://redis:6379/0"
    
    # Email / SMTP
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    SMTP_FROM: Optional[str] = None

    FRONTEND_URL: str

    # Docker Compose injects the root .env into the container environment and
    # those real environment variables always win. The files below are only
    # fallbacks for local, non-Docker development.
    model_config = SettingsConfigDict(
        env_file=(PROJECT_ROOT_ENV, BACKEND_LOCAL_ENV),
        case_sensitive=True,
        extra="ignore",
    )

settings = Settings()
