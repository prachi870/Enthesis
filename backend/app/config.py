"""Application configuration"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Enthesis"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Storage
    STORAGE_DIR: str = os.getenv("ENTHESIS_STORAGE_DIR", "storage")
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./enthesis.db"  # Changed from PostgreSQL to SQLite for local development
    )
    
    # JWT Authentication
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "your-secret-key-change-this-in-production-use-openssl-rand-hex-32"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Supabase OAuth identity verification (public anon key only).
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    
    # OAuth Configuration
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    OAUTH_REDIRECT_URI: str = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:3000/auth/callback")
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
    
    @property
    def cors_origins_list(self) -> list:
        """Convert CORS_ORIGINS string to list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env


settings = Settings()

# Backward compatibility
STORAGE_DIR = settings.STORAGE_DIR
