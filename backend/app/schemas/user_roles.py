from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    status: str
    lastActive: str
    department: str

class UserCreateRequest(BaseModel):
    name: str
    email: str
    role: str
    department: str

class RolePermissionResponse(BaseModel):
    module: str
    view: bool
    edit: bool
    create: bool
    delete: bool
    approve: bool

class RoleResponse(BaseModel):
    id: str
    roleName: str
    usersCount: int
    permissions: List[RolePermissionResponse]

class RoleCreateRequest(BaseModel):
    roleName: str
    permissions: List[RolePermissionResponse]
