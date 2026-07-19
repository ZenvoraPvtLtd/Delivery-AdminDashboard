from typing import List, Dict, Any
from app.repositories.settings import SettingsRepository, get_settings_repository
from app.schemas.settings import (
    BusinessSettingResponse, BusinessSettingUpdateRequest,
    ApiConfigurationResponse, BackupResponse,
    CommunicationDataResponse, EmailTemplateResponse, SmsTemplateResponse, ProviderResponse,
    TemplateUpdateRequest
)
from app.schemas.user_roles import UserResponse, RoleResponse, RolePermissionResponse

class SettingsService:
    def __init__(self, repository: SettingsRepository):
        self.repository = repository

    async def get_business_settings(self) -> BusinessSettingResponse:
        s = await self.repository.get_business_setting()
        return BusinessSettingResponse(
            deliveryFee=s.delivery_fee,
            packagingFee=s.packaging_fee,
            businessHours=s.business_hours
        )

    async def update_business_settings(self, req: BusinessSettingUpdateRequest) -> BusinessSettingResponse:
        s = await self.repository.get_business_setting()
        s.delivery_fee = req.deliveryFee
        s.packaging_fee = req.packagingFee
        s.business_hours = req.businessHours
        s = await self.repository.update_business_setting(s)
        return BusinessSettingResponse(
            deliveryFee=s.delivery_fee,
            packagingFee=s.packaging_fee,
            businessHours=s.business_hours
        )

    async def get_api_config(self) -> ApiConfigurationResponse:
        c = await self.repository.get_api_config()
        return ApiConfigurationResponse(
            googleMaps=c.google_maps_enabled,
            razorpay=c.razorpay_enabled,
            twilio=c.twilio_enabled,
            smtp=c.smtp_enabled
        )

    async def toggle_api_config(self, key: str, value: bool) -> ApiConfigurationResponse:
        c = await self.repository.get_api_config()
        if key == "Google Maps":
            c.google_maps_enabled = value
        elif key == "Razorpay Gateway":
            c.razorpay_enabled = value
        elif key == "Twilio SMS":
            c.twilio_enabled = value
        elif key == "SMTP Email Server":
            c.smtp_enabled = value
        c = await self.repository.update_api_config(c)
        return ApiConfigurationResponse(
            googleMaps=c.google_maps_enabled,
            razorpay=c.razorpay_enabled,
            twilio=c.twilio_enabled,
            smtp=c.smtp_enabled
        )

    async def get_backups(self) -> List[BackupResponse]:
        backs = await self.repository.get_backups()
        return [
            BackupResponse(id=b.backup_id, size=b.size, status=b.status, date=b.date)
            for b in backs
        ]

    async def trigger_backup(self) -> BackupResponse:
        b = await self.repository.create_backup()
        return BackupResponse(id=b.backup_id, size=b.size, status=b.status, date=b.date)

    async def get_communication_data(self) -> CommunicationDataResponse:
        emails = await self.repository.get_email_templates()
        sms = await self.repository.get_sms_templates()
        provs = await self.repository.get_providers()
        
        return CommunicationDataResponse(
            emailTemplates=[EmailTemplateResponse(type=e.template_type, subject=e.subject, body=e.body) for e in emails],
            smsTemplates=[SmsTemplateResponse(type=s.template_type, message=s.message) for s in sms],
            providers=[ProviderResponse(name=p.provider_name, isActive=p.is_active) for p in provs]
        )

    async def update_email_template(self, type_name: str, req: TemplateUpdateRequest) -> CommunicationDataResponse:
        await self.repository.update_email_template(type_name, req.subject or "", req.body)
        return await self.get_communication_data()

    async def toggle_provider(self, name: str) -> CommunicationDataResponse:
        await self.repository.toggle_provider(name)
        return await self.get_communication_data()

    # Users and Roles
    async def get_users(self) -> List[UserResponse]:
        users = await self.repository.get_users()
        return [
            UserResponse(
                id=str(u.id),
                name=u.username,
                email=u.email,
                role=u.role.name if u.role else "User",
                status="Active" if u.is_active else "Inactive",
                lastActive=u.created_at.strftime("%Y-%m-%d"),
                department="Operations"
            ) for u in users
        ]

    async def get_roles(self) -> List[RoleResponse]:
        roles = await self.repository.get_roles()
        res = []
        for r in roles:
            perms = []
            if hasattr(r, 'permissions') and r.permissions:
                for p in r.permissions:
                    perms.append(RolePermissionResponse(
                        module=p.resource,
                        view=p.read,
                        edit=p.update,
                        create=p.create,
                        delete=p.delete,
                        approve=p.approve if hasattr(p, 'approve') else False
                    ))
            else:
                # Add dummy module permissions if they don't have explicit granularity to avoid UI crash
                for m in ["Dashboard", "Orders Management", "Inventory", "System Settings"]:
                    perms.append(RolePermissionResponse(
                        module=m, view=True, edit=False, create=False, delete=False, approve=False
                    ))
            
            res.append(RoleResponse(
                id=str(r.id),
                roleName=r.name,
                usersCount=0, # Aggregate if needed
                permissions=perms
            ))
        return res

def get_settings_service() -> SettingsService:
    return SettingsService(get_settings_repository())
