from datetime import datetime, timezone
from typing import List, Optional, Annotated
from beanie import Document, Indexed
from pydantic import Field
from bson import ObjectId

class Role(Document):
    role_name: Annotated[str, Indexed(unique=True)]
    description: Optional[str] = None
    permissions: List[str] = []
    status: str = "active"
    created_at: Annotated[datetime, Indexed] = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Annotated[datetime, Indexed] = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "roles"
