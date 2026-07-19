from fastapi import APIRouter, Depends
from typing import Any, List
from app.services.settings import SettingsService, get_settings_service
from app.schemas.user_roles import UserResponse, RoleResponse
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
async def get_users_list(
    service: SettingsService = Depends(get_settings_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_users()

@router.get("/roles", response_model=List[RoleResponse])
async def get_roles_list(
    service: SettingsService = Depends(get_settings_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_roles()
