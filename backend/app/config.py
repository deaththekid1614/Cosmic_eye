from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    service_name: str = "cosmic-eye-api"
    service_version: str = "0.1.0"

    # Data source
    irsa_base_url: str = "https://irsa.ipac.caltech.edu"

    # Frontend origin allowed by CORS
    frontend_origin: str = "http://localhost:5173"

    # Safety limits
    cache_ttl_seconds: int = 300
    max_results: int = 50
    max_download_bytes: int = 50_000_000
    request_timeout_seconds: float = 30.0

    # Caching
    preview_cache_dir: Path = Path("tmp/previews")


settings = Settings()