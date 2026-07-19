from beanie import Document
from pydantic import Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class Banner(Document):
    banner_id: str = Field(default_factory=lambda: f"BAN-{uuid.uuid4().hex[:8].upper()}")
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    image_url: str
    banner_type: str = "Homepage" # Homepage, Offer, Popup
    display_location: str = "Top"
    priority: int = 1
    button_text: Optional[str] = None
    button_link: Optional[str] = None
    status: str = "Active" # Active, Paused
    schedule: str = "Always active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "banners"
        indexes = ["banner_id", "status"]

class MediaLibrary(Document):
    file_id: str = Field(default_factory=lambda: f"MED-{uuid.uuid4().hex[:8].upper()}")
    file_name: str
    file_type: str # Image, Video, PDF
    url: str
    folder: str = "root"
    tags: List[str] = []
    file_size_bytes: int = 0
    cloudinary_metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "media_library"
        indexes = ["file_id", "folder", "file_type"]

class WebsitePage(Document):
    page_slug: str # e.g. "about", "privacy", "faqs"
    page_title: str
    content: str = ""
    sections: List[Dict[str, Any]] = [] # For FAQs: [{"q": "...", "a": "..."}]
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    status: str = "Published"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "website_pages"
        indexes = ["page_slug"]

class AnnouncementBar(Document):
    message: str
    bg_color: str = "#000000"
    text_color: str = "#ffffff"
    cta_button: Optional[str] = None
    cta_link: Optional[str] = None
    priority: int = 1
    schedule: str = "Always active"
    status: str = "Active"
    
    class Settings:
        name = "announcement_bars"

class Popup(Document):
    title: str
    image_url: Optional[str] = None
    content: str
    popup_type: str = "Offer"
    trigger: str = "OnLoad"
    delay_seconds: int = 3
    status: str = "Active"

    class Settings:
        name = "popups"

class SEOSetting(Document):
    page_route: str
    meta_title: str
    meta_description: str
    meta_keywords: List[str] = []
    og_image: Optional[str] = None
    
    class Settings:
        name = "seo_settings"
        indexes = ["page_route"]

class NavigationMenu(Document):
    menu_type: str # Header, Footer, Sidebar
    items: List[Dict[str, Any]] = [] # {"label": "...", "link": "...", "order": 1}
    status: str = "Active"

    class Settings:
        name = "navigation_menus"
