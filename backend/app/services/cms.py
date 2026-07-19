from typing import List, Optional
from app.repositories.cms import CMSRepository, get_cms_repository
from app.models.cms import Banner, WebsitePage
from app.schemas.cms import BannerResponse, BannerCreateRequest, CMSPageResponse, CMSPageUpdateRequest
from fastapi import HTTPException

class CMSService:
    def __init__(self, repository: CMSRepository):
        self.repository = repository

    # Banners
    async def get_banners(self) -> List[BannerResponse]:
        banners = await self.repository.get_banners()
        return [
            BannerResponse(
                id=b.banner_id,
                title=b.title,
                image=b.image_url,
                status=b.status,
                type=b.banner_type,
                schedule=b.schedule
            ) for b in banners
        ]

    async def create_banner(self, req: BannerCreateRequest) -> BannerResponse:
        b = Banner(
            title=req.title,
            image_url=req.image,
            banner_type=req.type,
            status=req.status,
            schedule=req.schedule
        )
        b = await self.repository.create_banner(b)
        return BannerResponse(
            id=b.banner_id,
            title=b.title,
            image=b.image_url,
            status=b.status,
            type=b.banner_type,
            schedule=b.schedule
        )

    async def toggle_banner_status(self, banner_id: str) -> BannerResponse:
        b = await self.repository.get_banner(banner_id)
        if not b:
            raise HTTPException(status_code=404, detail="Banner not found")
            
        b.status = "Paused" if b.status == "Active" else "Active"
        b = await self.repository.update_banner(b)
        return BannerResponse(
            id=b.banner_id,
            title=b.title,
            image=b.image_url,
            status=b.status,
            type=b.banner_type,
            schedule=b.schedule
        )

    async def delete_banner(self, banner_id: str) -> None:
        b = await self.repository.get_banner(banner_id)
        if not b:
            raise HTTPException(status_code=404, detail="Banner not found")
        await self.repository.delete_banner(b)

    # Pages
    async def get_cms_pages(self) -> CMSPageResponse:
        about = await self.repository.get_page("about")
        if not about:
            about = await self.repository.create_page(WebsitePage(page_slug="about", page_title="About Us", content="Delivo is a premium, multi-outlet food and beverage delivery logistics network delivering freshness within minutes."))
            
        privacy = await self.repository.get_page("privacy")
        if not privacy:
            privacy = await self.repository.create_page(WebsitePage(page_slug="privacy", page_title="Privacy Policy", content="Your data security is critical to us. We store credit information using PCI-compliant tokens and verify rider compliance."))
            
        faqs = await self.repository.get_page("faqs")
        if not faqs:
            faqs = await self.repository.create_page(WebsitePage(
                page_slug="faqs", 
                page_title="FAQs",
                sections=[
                    {"q": "How do I request a cancellation refund?", "a": "Clients request refund forms from the portal. The Finance Manager reviews and issues wallet payouts instantly."},
                    {"q": "What is the base delivery rate charge policy?", "a": "Based on distance: $2.00 base charge for first 3 miles, plus $0.80 per mile beyond, configured in local settings."},
                    {"q": "How can Outlet Managers adjust tax details?", "a": "Outlet managers have read/edit parameters for their specific outlets in Outlet settings."}
                ]
            ))

        return CMSPageResponse(
            aboutUs=about.content,
            privacyPolicy=privacy.content,
            faqs=faqs.sections
        )

    async def update_cms_pages(self, req: CMSPageUpdateRequest) -> CMSPageResponse:
        about = await self.repository.get_page("about")
        if about:
            about.content = req.aboutUs
            await self.repository.update_page(about)
            
        privacy = await self.repository.get_page("privacy")
        if privacy:
            privacy.content = req.privacyPolicy
            await self.repository.update_page(privacy)

        # Retrieve faqs to return the complete object
        faqs = await self.repository.get_page("faqs")
        faq_sections = faqs.sections if faqs else []

        return CMSPageResponse(
            aboutUs=req.aboutUs,
            privacyPolicy=req.privacyPolicy,
            faqs=faq_sections
        )

def get_cms_service() -> CMSService:
    return CMSService(get_cms_repository())
