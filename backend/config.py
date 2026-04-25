from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Database Settings
    DATABASE_URL: str = "postgresql+asyncpg://postgres:12345@db:5432/ids_db"
    
    # Security Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    API_KEY: str

    # SMTP Settings
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    
    # Redis Settings
    REDIS_URL: str = "redis://redis:6379/0"
    
    # Frontend Info
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()