from functools import lru_cache

from pydantic import AnyUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SERVER_PORT: int

    DATABASE_URL: AnyUrl

    # Supabase Auth — used to verify JWTs issued by Supabase Auth (GoTrue).
    # SUPABASE_URL drives the JWKS lookup; SUPABASE_JWT_SECRET is the legacy
    # HS256 fallback for tokens signed before the project rotated to asymmetric
    # signing keys.
    SUPABASE_URL: AnyUrl
    SUPABASE_JWT_SECRET: str

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
