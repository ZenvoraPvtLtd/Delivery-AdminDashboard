from repositories.base_repository import BaseRepository
from typing import List, Dict, Any, Optional

class DeliveryPartnerRepository(BaseRepository):
    collection_name = "delivery_partners"

    @classmethod
    async def get_by_status(cls, status: str) -> List[Dict[str, Any]]:
        cursor = cls.get_collection().find({"status": status, "is_deleted": False})
        return await cursor.to_list(length=100)

    @classmethod
    async def update_location(cls, rider_id: str, lat: float, lng: float) -> bool:
        result = await cls.get_collection().update_one(
            {"id": rider_id},
            {"$set": {"latitude": lat, "longitude": lng}}
        )
        return result.modified_count > 0

    @classmethod
    async def assign_order(cls, rider_id: str, order_id: Optional[str]) -> bool:
        status = "On Delivery" if order_id else "Available"
        result = await cls.get_collection().update_one(
            {"id": rider_id},
            {"$set": {"assignedOrderId": order_id, "status": status}}
        )
        return result.modified_count > 0
