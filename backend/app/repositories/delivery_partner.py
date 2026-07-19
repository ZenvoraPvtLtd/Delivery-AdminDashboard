from typing import List, Optional, Tuple, Dict, Any
from app.models.delivery_partner import (
    DeliveryPartner, DeliveryPartnerVehicle, DeliveryPartnerLocation, 
    DeliveryPartnerEarning, DeliveryPartnerActivityLog
)
from beanie.operators import RegEx

class DeliveryPartnerRepository:
    
    async def create_partner(self, partner: DeliveryPartner) -> DeliveryPartner:
        return await partner.insert()
        
    async def create_vehicle(self, vehicle: DeliveryPartnerVehicle) -> DeliveryPartnerVehicle:
        return await vehicle.insert()

    async def get_partner(self, partner_id: str) -> Optional[DeliveryPartner]:
        return await DeliveryPartner.get(partner_id)
        
    async def get_partner_by_mobile(self, mobile: str) -> Optional[DeliveryPartner]:
        return await DeliveryPartner.find_one(DeliveryPartner.mobile_number == mobile)

    async def list_partners(self, 
                            skip: int = 0, 
                            limit: int = 20, 
                            search: Optional[str] = None, 
                            status: Optional[str] = None,
                            sort_by: str = "-created_at") -> Tuple[List[DeliveryPartner], int]:
        
        query = {}
        if search:
            regex = RegEx(pattern=search, options="i")
            query["$or"] = [
                {"full_name": regex},
                {"mobile_number": regex},
                {"partner_id": regex}
            ]
            
        if status and status != "All":
            query["status"] = status

        find_query = DeliveryPartner.find(query)
        total = await find_query.count()
        
        sort_field = sort_by.lstrip("-")
        sort_order = -1 if sort_by.startswith("-") else 1
        
        partners = await find_query.sort((sort_field, sort_order)).skip(skip).limit(limit).to_list()
        return partners, total

    async def update_partner(self, partner: DeliveryPartner) -> DeliveryPartner:
        return await partner.save()

    async def update_location(self, location: DeliveryPartnerLocation) -> DeliveryPartnerLocation:
        # Find existing and update or create new
        existing = await DeliveryPartnerLocation.find_one(DeliveryPartnerLocation.partner_id == location.partner_id)
        if existing:
            existing.latitude = location.latitude
            existing.longitude = location.longitude
            existing.updated_time = location.updated_time
            return await existing.save()
        return await location.insert()

    async def get_vehicle(self, partner_id: str) -> Optional[DeliveryPartnerVehicle]:
        return await DeliveryPartnerVehicle.find_one(DeliveryPartnerVehicle.partner_id == partner_id)

    async def add_activity_log(self, log: DeliveryPartnerActivityLog) -> DeliveryPartnerActivityLog:
        return await log.insert()

    async def get_summary_stats(self) -> Dict[str, Any]:
        total = await DeliveryPartner.find_all().count()
        available = await DeliveryPartner.find(DeliveryPartner.status == "Available").count()
        on_delivery = await DeliveryPartner.find(DeliveryPartner.status == "On Delivery").count()
        offline = await DeliveryPartner.find(DeliveryPartner.status == "Offline").count()
        
        return {
            "total_riders": total,
            "available_riders": available,
            "busy_riders": on_delivery,
            "offline_riders": offline
        }

def get_delivery_partner_repository() -> DeliveryPartnerRepository:
    return DeliveryPartnerRepository()
