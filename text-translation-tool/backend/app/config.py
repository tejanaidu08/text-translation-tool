from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/translation_db"
    APP_ENV: str = "development"
    MAX_INPUT_LENGTH: int = 5000
    CORS_ORIGINS: str = "http://localhost:3000"
    TRANSLATION_PROVIDER: str = "mymemory"

    class Config:
        env_file = ".env"

    def get_cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
