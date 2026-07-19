from datetime import datetime, timezone
from typing import Annotated
from beanie import Document, Indexed
from pydantic import Field

class RefreshToken(Document):
    user_id: Annotated[str, Indexed]
    token: Annotated[str, Indexed(unique=True)]
    device: str = "unknown"
    ip: str = "unknown"
    browser: str = "unknown"
    expires_at: datetime
    created_at: Annotated[datetime, Indexed] = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "refresh_tokens"
