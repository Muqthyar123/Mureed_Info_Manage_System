from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    env: str = Field("development", validation_alias=AliasChoices("MIMS_ENV", "APP_ENV", "ENVIRONMENT"))
    database_url: str = Field("sqlite:///./mims.db", validation_alias=AliasChoices("MIMS_DATABASE_URL", "DATABASE_URL"))
    secret_key: str = "change-this-for-local-development"
    main_admin_email: str = Field(
        "aasthanakhadariyaaskariya.admin@gmail.com",
        validation_alias=AliasChoices("MAIN_ADMIN_EMAIL", "MIMS_MAIN_ADMIN_EMAIL"),
    )
    demo_otp: str = "123456"
    otp_ttl_seconds: int = 600
    frontend_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    auth_backend: str = "local"
    supabase_url: str = Field("", validation_alias=AliasChoices("SUPABASE_URL", "MIMS_SUPABASE_URL"))
    supabase_anon_key: str = Field("", validation_alias=AliasChoices("SUPABASE_ANON_KEY", "MIMS_SUPABASE_ANON_KEY"))
    supabase_service_role_key: str = Field(
        "", validation_alias=AliasChoices("SUPABASE_SERVICE_ROLE_KEY", "MIMS_SUPABASE_SERVICE_ROLE_KEY")
    )
    frontend_url: str = Field("http://localhost:5173", validation_alias=AliasChoices("FRONTEND_URL", "MIMS_FRONTEND_URL"))
    brevo_api_key: str = Field("", validation_alias=AliasChoices("BREVO_API_KEY", "MIMS_BREVO_API_KEY"))
    brevo_sender_mail: str = Field("", validation_alias=AliasChoices("BREVO_SENDER_MAIL", "MIMS_BREVO_SENDER_MAIL"))

    model_config = SettingsConfigDict(env_prefix="MIMS_", env_file=".env", extra="ignore")


    @property
    def is_production(self) -> bool:
        return self.env.strip().lower() in ("production", "prod")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]

    @property
    def use_supabase_auth(self) -> bool:
        return self.auth_backend.strip().lower() == "supabase" or self.is_production

    def require_supabase(self) -> None:
        missing = []
        if not self.supabase_url.strip():
            missing.append("SUPABASE_URL")
        if not self.supabase_anon_key.strip():
            missing.append("SUPABASE_ANON_KEY")
        if not self.supabase_service_role_key.strip():
            missing.append("SUPABASE_SERVICE_ROLE_KEY")
        if missing:
            names = ", ".join(missing)
            raise RuntimeError(f"Supabase auth mode requires {names}.")

    def validate_production(self) -> None:
        if self.is_production:
            if self.database_url.strip().startswith("sqlite"):
                raise RuntimeError("Production mode cannot use SQLite as the database.")
            if self.auth_backend.strip().lower() != "supabase":
                raise RuntimeError("Production mode must use Supabase Auth (AUTH_BACKEND=supabase).")
            self.require_supabase()



@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_production()
    return settings

