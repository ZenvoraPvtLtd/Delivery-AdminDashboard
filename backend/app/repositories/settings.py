from typing import List, Optional
from app.models.settings import BusinessSetting, ApiConfiguration, DatabaseBackup
from app.models.user import User
from app.models.role import Role
from app.models.communication import EmailTemplate, SmsTemplate, ProviderConfig
import uuid
from datetime import datetime

class SettingsRepository:
    
    async def get_business_setting(self) -> BusinessSetting:
        setting = await BusinessSetting.find_one({"setting_id": "default_business"})
        if not setting:
            setting = await BusinessSetting().insert()
        return setting

    async def update_business_setting(self, setting: BusinessSetting) -> BusinessSetting:
        return await setting.save()

    async def get_api_config(self) -> ApiConfiguration:
        config = await ApiConfiguration.find_one({"setting_id": "default_apis"})
        if not config:
            config = await ApiConfiguration().insert()
        return config

    async def update_api_config(self, config: ApiConfiguration) -> ApiConfiguration:
        return await config.save()

    async def get_backups(self) -> List[DatabaseBackup]:
        return await DatabaseBackup.find_all().sort("-created_at").to_list()

    async def create_backup(self) -> DatabaseBackup:
        backup = DatabaseBackup(
            backup_id=f"BAK-{uuid.uuid4().hex[:4].upper()}",
            size="5.1 MB",
            date=datetime.utcnow().strftime("%Y-%m-%d %I:%M %p")
        )
        return await backup.insert()

    # Communication
    async def get_email_templates(self) -> List[EmailTemplate]:
        templates = await EmailTemplate.find_all().to_list()
        if not templates:
            templates = [
                await EmailTemplate(template_type="Order Receipt", subject="Your Delivo Order Receipt", body="Hi {name}, your order {orderId} is confirmed. Total: {total}.").insert(),
                await EmailTemplate(template_type="Password Reset", subject="Password Reset Request", body="Click here to reset your password: {link}").insert(),
                await EmailTemplate(template_type="Delivery Update", subject="Order out for delivery!", body="Your rider is arriving in {time} mins.").insert()
            ]
        return templates

    async def update_email_template(self, type_name: str, subject: str, body: str) -> None:
        template = await EmailTemplate.find_one({"template_type": type_name})
        if template:
            template.subject = subject
            template.body = body
            await template.save()

    async def get_sms_templates(self) -> List[SmsTemplate]:
        templates = await SmsTemplate.find_all().to_list()
        if not templates:
            templates = [
                await SmsTemplate(template_type="Order Dispached", message="Delivo: Order {orderId} dispatched! Track: {link}").insert(),
                await SmsTemplate(template_type="OTP Login", message="Your Delivo login OTP is {otp}. Do not share this.").insert()
            ]
        return templates

    async def get_providers(self) -> List[ProviderConfig]:
        providers = await ProviderConfig.find_all().to_list()
        if not providers:
            providers = [
                await ProviderConfig(provider_name="SMTP Relay", is_active=True).insert(),
                await ProviderConfig(provider_name="SendGrid API", is_active=False).insert(),
                await ProviderConfig(provider_name="Twilio SMS", is_active=True).insert()
            ]
        return providers

    async def toggle_provider(self, name: str) -> None:
        p = await ProviderConfig.find_one({"provider_name": name})
        if p:
            p.is_active = not p.is_active
            await p.save()

    # Users and Roles
    async def get_users(self) -> List[User]:
        return await User.find_all().to_list()
        
    async def get_roles(self) -> List[Role]:
        return await Role.find_all().to_list()

def get_settings_repository() -> SettingsRepository:
    return SettingsRepository()
