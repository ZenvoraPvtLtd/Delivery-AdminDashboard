from fastapi import APIRouter, Depends, Request
from typing import Any, List
from app.services.cms import CMSService, get_cms_service
from app.schemas.cms import (
    BannerResponse, BannerCreateRequest, CMSPageResponse, CMSPageUpdateRequest
)
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/banners", response_model=List[BannerResponse], summary="List Banners")
async def list_banners(
    service: CMSService = Depends(get_cms_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_banners()

@router.post("/banners", response_model=BannerResponse, summary="Create Banner")
async def create_banner(
    data: BannerCreateRequest,
    service: CMSService = Depends(get_cms_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.create_banner(data)

@router.put("/banners/{banner_id}/status", response_model=BannerResponse, summary="Toggle Banner Status")
async def toggle_banner_status(
    banner_id: str,
    service: CMSService = Depends(get_cms_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.toggle_banner_status(banner_id)

@router.delete("/banners/{banner_id}", summary="Delete Banner")
async def delete_banner(
    banner_id: str,
    service: CMSService = Depends(get_cms_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    await service.delete_banner(banner_id)
    return {"status": "success"}

@router.get("/pages", response_model=CMSPageResponse, summary="Get CMS Pages")
async def get_cms_pages(
    service: CMSService = Depends(get_cms_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.get_cms_pages()

@router.put("/pages", response_model=CMSPageResponse, summary="Update CMS Pages")
async def update_cms_pages(
    data: CMSPageUpdateRequest,
    service: CMSService = Depends(get_cms_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await service.update_cms_pages(data)
