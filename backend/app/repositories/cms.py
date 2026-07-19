from typing import List, Optional
from app.models.cms import Banner, WebsitePage

class CMSRepository:
    
    # Banners
    async def get_banners(self) -> List[Banner]:
        return await Banner.find_all().to_list()
        
    async def get_banner(self, banner_id: str) -> Optional[Banner]:
        return await Banner.find_one({"banner_id": banner_id})
        
    async def create_banner(self, banner: Banner) -> Banner:
        return await banner.insert()

    async def update_banner(self, banner: Banner) -> Banner:
        return await banner.save()

    async def delete_banner(self, banner: Banner) -> None:
        await banner.delete()

    # Pages
    async def get_page(self, slug: str) -> Optional[WebsitePage]:
        return await WebsitePage.find_one({"page_slug": slug})

    async def create_page(self, page: WebsitePage) -> WebsitePage:
        return await page.insert()

    async def update_page(self, page: WebsitePage) -> WebsitePage:
        return await page.save()

def get_cms_repository() -> CMSRepository:
    return CMSRepository()
