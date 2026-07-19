from datetime import datetime, timezone
from typing import Optional, Annotated
from beanie import Document, Indexed
from pydantic import Field, EmailStr
from bson import ObjectId

class User(Document):
    user_id: str = Field(default_factory=lambda: str(ObjectId()))
    full_name: str
    email: Annotated[EmailStr, Indexed(unique=True)]
    mobile_number: Annotated[str, Indexed(unique=True)]
    password_hash: str
    role_id: Annotated[str, Indexed]
    status: Annotated[str, Indexed] = "active"
    is_verified: bool = False
    profile_image: Optional[str] = None
    last_login: Optional[datetime] = None
    failed_login_attempts: int = 0
    account_locked: bool = False
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: Annotated[datetime, Indexed] = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Annotated[datetime, Indexed] = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
