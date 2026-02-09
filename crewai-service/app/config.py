"""
Configuration settings for CrewAI microservice.

Loads settings from environment variables with sensible defaults.
"""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    # API Security
    api_key: Optional[str] = None  # Shared secret for Next.js <-> Python auth

    # Google AI (Gemini)
    google_ai_api_key: str  # Required - Gemini API key

    # Google Workspace APIs (optional - for tools)
    gmail_client_id: Optional[str] = None
    gmail_client_secret: Optional[str] = None
    google_docs_api_key: Optional[str] = None
    google_sheets_api_key: Optional[str] = None

    # Search API
    serpapi_key: Optional[str] = None

    # Next.js App (for callbacks)
    nextjs_app_url: str = "http://localhost:3000"
    nextjs_callback_secret: Optional[str] = None

    # CrewAI Settings
    crewai_verbose: bool = True
    crewai_max_iterations: int = 15
    default_llm_model: str = "gemini/gemini-2.0-flash"
    default_llm_temperature: float = 0.7

    # Rate Limiting
    max_concurrent_executions: int = 5
    execution_timeout_seconds: int = 300  # 5 minutes

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return not self.debug

    @property
    def has_search_capability(self) -> bool:
        """Check if search tools are available."""
        return self.serpapi_key is not None

    @property
    def has_gmail_capability(self) -> bool:
        """Check if Gmail tools are available."""
        return self.gmail_client_id is not None and self.gmail_client_secret is not None

    @property
    def has_docs_capability(self) -> bool:
        """Check if Google Docs tools are available."""
        return self.google_docs_api_key is not None

    @property
    def has_sheets_capability(self) -> bool:
        """Check if Google Sheets tools are available."""
        return self.google_sheets_api_key is not None


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Convenience alias
settings = get_settings()
