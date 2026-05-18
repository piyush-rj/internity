from functools import lru_cache

from pydantic import AnyUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SERVER_JWT_SECRET: str
    SERVER_PORT: int

    DATABASE_URL: AnyUrl

    MINIO_ENDPOINT: AnyUrl
    MINIO_PUBLIC_ENDPOINT: AnyUrl | None = None
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET: str
    MINIO_REGION: str = "us-east-1"

    SERVER_RAZORPAY_ID: str | None = None
    SERVER_RAZORPAY_SECRET: str | None = None

    CORS_ORIGIN: str = Field(default="http://localhost:3000")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
