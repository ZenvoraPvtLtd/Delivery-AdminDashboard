from repositories.base_repository import BaseRepository
from typing import Optional, Dict, Any

class PaymentRepository(BaseRepository):
    collection_name = "payments"

    @classmethod
    async def get_by_order(cls, order_id: str) -> Optional[Dict[str, Any]]:
        return await cls.get_collection().find_one({"order_id": order_id, "is_deleted": False})
