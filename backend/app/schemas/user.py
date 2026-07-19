from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.constants.roles import Role

class CreateUserRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    mobile_number: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8)
    role: Role = Role.SUPPORT

class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    mobile_number: Optional[str] = Field(None, min_length=10, max_length=15)
    role: Optional[Role] = None
    status: Optional[str] = None
    is_verified: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    mobile_number: str
    role: Role
    status: str
    is_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
