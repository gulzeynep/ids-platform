from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "W-IDS Platform"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str
    
    # Auth & Security
    API_KEY: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    
    # Redis
    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_URL: str
    
    # Email / SMTP
    SMTP_SERVER: str
    SMTP_PORT: int
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()