from repositories.base_repository import BaseRepository
from typing import List, Dict, Any, Optional

class OrderRepository(BaseRepository):
    collection_name = "orders"

    @classmethod
    async def get_by_customer(cls, customer_id: str) -> List[Dict[str, Any]]:
        cursor = cls.get_collection().find({"customerId": customer_id, "is_deleted": False})
        return await cursor.to_list(length=100)

    @classmethod
    async def get_by_rider(cls, rider_id: str) -> List[Dict[str, Any]]:
        cursor = cls.get_collection().find({"deliveryPartnerId": rider_id, "is_deleted": False})
        return await cursor.to_list(length=100)

    @classmethod
    async def get_pending_confirmations(cls) -> List[Dict[str, Any]]:
        cursor = cls.get_collection().find({
            "confirmation_status": "Pending",
            "is_deleted": False
        })
        return await cursor.to_list(length=100)

    @classmethod
    async def add_timeline_event(cls, order_id: str, event: Dict[str, Any]) -> bool:
        result = await cls.get_collection().update_one(
            {"id": order_id},
            {"$push": {"timeline": event}}
        )
        return result.modified_count > 0
