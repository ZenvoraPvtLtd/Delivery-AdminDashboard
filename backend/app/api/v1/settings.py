from fastapi import APIRouter, Depends, Request
from typing import Any, List
from app.services.settings import SettingsService, get_settings_service
from app.schemas.settings import (
    BusinessSettingResponse, BusinessSettingUpdateRequest,
    ApiConfigurationResponse, BackupResponse,
    CommunicationDataResponse, TemplateUpdateRequest
)
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/business", response_model=BusinessSettingResponse)
async def get_business_settings(
    service: SettingsService = Depends(get_settings_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_business_settings()

@router.put("/business", response_model=BusinessSettingResponse)
async def update_business_settings(
    data: BusinessSettingUpdateRequest,
    service: SettingsService = Depends(get_settings_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.update_business_settings(data)

@router.get("/apis", response_model=ApiConfigurationResponse)
async def get_api_configs(
    service: SettingsService = Depends(get_settings_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_api_config()

@router.put("/apis/toggle", response_model=ApiConfigurationResponse)
async def toggle_api_config(
    key: str,
    value: bool,
    service: SettingsService = Depends(get_settings_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.toggle_api_config(key, value)

@router.get("/backups", response_model=List[BackupResponse])
async def get_backups(
    service: SettingsService = Depends(get_settings_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_backups()

@router.post("/backups", response_model=BackupResponse)
async def trigger_backup(
    service: SettingsService = Depends(get_settings_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.trigger_backup()

@router.get("/communication", response_model=CommunicationDataResponse)
async def get_communication_data(
    service: SettingsService = Depends(get_settings_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_communication_data()

@router.put("/communication/templates/{type_name}", response_model=CommunicationDataResponse)
async def update_email_template(
    type_name: str,
    data: TemplateUpdateRequest,
    service: SettingsService = Depends(get_settings_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.update_email_template(type_name, data)

@router.put("/communication/providers/{name}/toggle", response_model=CommunicationDataResponse)
async def toggle_provider(
    name: str,
    service: SettingsService = Depends(get_settings_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.toggle_provider(name)
