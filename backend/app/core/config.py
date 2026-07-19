from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Delivery Admin Dashboard API"
    APP_ENV: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    ALLOWED_ORIGINS: str = "*"
    
    MONGODB_URL: str
    DATABASE_NAME: str
    
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    SUPER_ADMIN_NAME: str = "Super Admin"
    SUPER_ADMIN_EMAIL: str = "admin@delivery.com"
    SUPER_ADMIN_PASSWORD: str = "SecurePassword123!"
    SUPER_ADMIN_MOBILE: str = "9999999999"
    
    CLOUDINARY_URL: str | None = None
    SMTP_SERVER: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    TWILIO_ACCOUNT_SID: str | None = None
    TWILIO_AUTH_TOKEN: str | None = None
    TWILIO_PHONE_NUMBER: str | None = None
    WHATSAPP_API_KEY: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
