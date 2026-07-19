from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# Settings
class BusinessSettingResponse(BaseModel):
    deliveryFee: str
    packagingFee: str
    businessHours: str

class BusinessSettingUpdateRequest(BaseModel):
    deliveryFee: str
    packagingFee: str
    businessHours: str

class ApiConfigurationResponse(BaseModel):
    googleMaps: bool
    razorpay: bool
    twilio: bool
    smtp: bool

class BackupResponse(BaseModel):
    id: str
    size: str
    status: str
    date: str

# Communication
class EmailTemplateResponse(BaseModel):
    type: str
    subject: str
    body: str

class SmsTemplateResponse(BaseModel):
    type: str
    message: str

class ProviderResponse(BaseModel):
    name: str
    isActive: bool

class CommunicationDataResponse(BaseModel):
    emailTemplates: List[EmailTemplateResponse]
    smsTemplates: List[SmsTemplateResponse]
    providers: List[ProviderResponse]

class TemplateUpdateRequest(BaseModel):
    subject: Optional[str] = None
    body: str
