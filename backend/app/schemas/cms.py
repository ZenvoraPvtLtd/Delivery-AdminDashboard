from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class BannerResponse(BaseModel):
    id: str
    title: str
    image: str
    status: str
    type: str
    schedule: str

class BannerCreateRequest(BaseModel):
    title: str
    image: str
    status: str = "Active"
    type: str = "Homepage"
    schedule: str = "Always active"

class CMSPageResponse(BaseModel):
    aboutUs: str
    privacyPolicy: str
    faqs: List[Dict[str, str]]

class CMSPageUpdateRequest(BaseModel):
    aboutUs: str
    privacyPolicy: str
    # we can ignore FAQs updating in this phase per the UI constraint, or allow it
