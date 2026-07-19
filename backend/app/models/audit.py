from datetime import datetime, timezone
from typing import Optional, Any, Annotated
from beanie import Document, Indexed
from pydantic import Field

class AuditLog(Document):
    user_id: Annotated[Optional[str], Indexed] = None
    module: Annotated[str, Indexed]
    action: str
    old_data: Optional[dict[str, Any]] = None
    new_data: Optional[dict[str, Any]] = None
    browser: str = "unknown"
    ip: str = "unknown"
    device: str = "unknown"
    endpoint: str = "unknown"
    request_method: str = "unknown"
    response_status: Optional[int] = None
    timestamp: Annotated[datetime, Indexed] = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "audit_logs"
