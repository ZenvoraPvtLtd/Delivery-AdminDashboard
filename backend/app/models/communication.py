from beanie import Document
from pydantic import Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class EmailTemplate(Document):
    template_type: str # Order Receipt, Password Reset
    subject: str
    body: str
    is_active: bool = True
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "email_templates"

class SmsTemplate(Document):
    template_type: str
    message: str
    is_active: bool = True
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "sms_templates"

class ProviderConfig(Document):
    provider_name: str # SMTP, SendGrid, Twilio
    api_key: Optional[str] = None
    secret: Optional[str] = None
    is_active: bool = True

    class Settings:
        name = "provider_configs"
