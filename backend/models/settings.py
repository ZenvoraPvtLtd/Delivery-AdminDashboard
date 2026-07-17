from pydantic import BaseModel, Field
from typing import Dict
from models.base import MongoBaseModel

class ApiKeys(BaseModel):
    metaToken: str = Field(default="")
    twilioSid: str = Field(default="")
    twilioAuthToken: str = Field(default="")
    msg91Key: str = Field(default="")
    textlocalKey: str = Field(default="")
    fast2smsKey: str = Field(default="")

class Templates(BaseModel):
    confirmation: str = Field(default="")
    cancellation: str = Field(default="")
    success: str = Field(default="")
    reminder: str = Field(default="")

class CommunicationSettings(MongoBaseModel):
    enableWhatsapp: bool = Field(default=True)
    enableSms: bool = Field(default=True)
    defaultProvider: str = Field(default="meta")
    whatsappProvider: str = Field(default="meta")
    smsProvider: str = Field(default="twilio")
    webhookSecret: str = Field(default="whsec_ZenvoraSecretToken2026")
    retryCount: int = Field(default=3)
    confirmationExpiry: int = Field(default=24)
    apiKeys: ApiKeys = Field(default_factory=ApiKeys)
    templates: Templates = Field(default_factory=Templates)
