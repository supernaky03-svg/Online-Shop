from functools import lru_cache
from typing import List
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field(alias="DATABASE_URL")
    admin_password: str = Field(alias="ADMIN_PASSWORD")
    admin_session_secret: str = Field(alias="ADMIN_SESSION_SECRET")
    cloudinary_cloud_name: str = Field(alias="CLOUDINARY_CLOUD_NAME")
    cloudinary_api_key: str = Field(alias="CLOUDINARY_API_KEY")
    cloudinary_api_secret: str = Field(alias="CLOUDINARY_API_SECRET")
    cors_origins: str = Field(default="http://localhost:5173,http://localhost:5174", alias="CORS_ORIGINS")

    max_upload_mb: int = Field(default=5, alias="MAX_UPLOAD_MB")
    admin_session_days: int = Field(default=7, alias="ADMIN_SESSION_DAYS")
    cloudinary_folder: str = Field(default="online-shop", alias="CLOUDINARY_FOLDER")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        """Convert Neon/Postgres URLs to SQLAlchemy asyncpg URLs and remove asyncpg-unsupported query params."""
        raw = self.database_url.strip()
        if raw.startswith("postgres://"):
            raw = "postgresql://" + raw[len("postgres://") :]
        if raw.startswith("postgresql://"):
            raw = "postgresql+asyncpg://" + raw[len("postgresql://") :]

        parts = urlsplit(raw)
        query = dict(parse_qsl(parts.query, keep_blank_values=True))
        # asyncpg receives SSL via connect_args, not sslmode/channel_binding URL params.
        query.pop("sslmode", None)
        query.pop("channel_binding", None)
        return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))

    @property
    def needs_ssl(self) -> bool:
        return "sslmode=require" in self.database_url or ".neon.tech" in self.database_url

    @property
    def cookie_secure(self) -> bool:
        return any(origin.startswith("https://") for origin in self.cors_origin_list)


@lru_cache
def get_settings() -> Settings:
    return Settings()
