from typing import List, Optional, Tuple, Dict, Any
from app.repositories.delivery_partner import DeliveryPartnerRepository, get_delivery_partner_repository
from app.models.delivery_partner import DeliveryPartner, DeliveryPartnerVehicle, DeliveryPartnerLocation, DeliveryPartnerActivityLog
from app.schemas.delivery_partner import DeliveryPartnerCreate, DutyStatusUpdate, LicenseVerifyUpdate
from fastapi import HTTPException
from datetime import datetime

class DeliveryPartnerService:
    def __init__(self, repository: DeliveryPartnerRepository):
        self.repository = repository

    async def create_partner(self, data: DeliveryPartnerCreate, request_info: dict) -> DeliveryPartner:
        if data.mobile_number and await self.repository.get_partner_by_mobile(data.mobile_number):
            raise HTTPException(status_code=400, detail="Mobile number already registered")

        # Create Partner
        partner = DeliveryPartner(
            full_name=data.full_name,
            mobile_number=data.mobile_number,
            email=data.email,
            emergency_contact=data.emergency_contact,
            address=data.address,
            city=data.city,
            state=data.state,
            status="Available"
        )
        created_partner = await self.repository.create_partner(partner)
        
        # Create Vehicle
        vehicle = DeliveryPartnerVehicle(
            partner_id=str(created_partner.id),
            vehicle_type=data.vehicle_type,
            vehicle_number=data.vehicle_number
        )
        await self.repository.create_vehicle(vehicle)
        
        await self._log_activity(str(created_partner.id), "Registered", f"Partner registered with {data.vehicle_type}", request_info)
        return created_partner

    async def get_partner(self, partner_id: str) -> DeliveryPartner:
        partner = await self.repository.get_partner(partner_id)
        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")
        return partner
        
    async def get_vehicle(self, partner_id: str) -> Optional[DeliveryPartnerVehicle]:
        return await self.repository.get_vehicle(partner_id)

    async def list_partners(self, skip: int, limit: int, search: Optional[str], status_filter: Optional[str], sort: str) -> Tuple[List[DeliveryPartner], int]:
        return await self.repository.list_partners(skip, limit, search, status_filter, sort)

    async def update_duty_status(self, partner_id: str, data: DutyStatusUpdate, request_info: dict) -> DeliveryPartner:
        partner = await self.get_partner(partner_id)
        partner.status = data.status
        partner.updated_at = datetime.utcnow()
        if data.status in ["Available", "On Delivery"]:
            partner.last_active_time = datetime.utcnow()
            
        updated = await self.repository.update_partner(partner)
        await self._log_activity(partner_id, "Duty Shift", f"Status changed to {data.status}", request_info)
        return updated

    async def verify_license(self, partner_id: str, data: LicenseVerifyUpdate, request_info: dict) -> DeliveryPartner:
        partner = await self.get_partner(partner_id)
        partner.license_verified = data.verified
        if data.verified:
            partner.verification_status = "Verified"
        partner.updated_at = datetime.utcnow()
        updated = await self.repository.update_partner(partner)
        await self._log_activity(partner_id, "Compliance", f"License verification set to {data.verified}", request_info)
        return updated

    async def get_summary(self) -> Dict[str, Any]:
        return await self.repository.get_summary_stats()

    # Helpers
    async def _log_activity(self, partner_id: str, action: str, description: str, request_info: dict):
        log = DeliveryPartnerActivityLog(
            partner_id=partner_id,
            action=action,
            description=description,
            performed_by=request_info.get("performed_by", "System"),
            ip_address=request_info.get("ip", "unknown")
        )
        await self.repository.add_activity_log(log)

def get_delivery_partner_service() -> DeliveryPartnerService:
    return DeliveryPartnerService(get_delivery_partner_repository())
