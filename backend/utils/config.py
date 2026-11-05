"""
Configuration Management for Krishi Saathi AI Backend.
Loads environment variables from .env file with safe defaults.
"""

import os
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "Krishi Saathi AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Server binding
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # JWT Authentication Security
    SECRET_KEY: str = "krishi_saathi_hackathon_super_secret_jwt_key_2026_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database connection URL
    # Defaults to SQLite for local zero-setup; replace with Supabase PostgreSQL URL in production
    DATABASE_URL: str = "sqlite:///./krishi_saathi.db"

    # External APIs
    GEMINI_API_KEY: str = ""
    DATA_GOV_IN_API_KEY: str = ""
    BHASHINI_USER_ID: str = ""
    BHASHINI_API_KEY: str = ""
    BHASHINI_PIPELINE_ID: str = ""

    # CORS Allowed Origins
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated origins into a list of strings."""
        if not self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """Returns cached settings instance so environment is read only once."""
    return Settings()


settings = get_settings()
