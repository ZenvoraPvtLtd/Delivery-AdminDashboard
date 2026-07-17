from repositories.base_repository import BaseRepository
from typing import Optional, Dict, Any

class CustomerRepository(BaseRepository):
    collection_name = "customers"

    @classmethod
    async def get_by_phone(cls, phone: str) -> Optional[Dict[str, Any]]:
        return await cls.get_collection().find_one({"phone": phone, "is_deleted": False})

    @classmethod
    async def get_by_email(cls, email: str) -> Optional[Dict[str, Any]]:
        return await cls.get_collection().find_one({"email": email, "is_deleted": False})

    @classmethod
    async def update_wallet(cls, id_value: str, amount: float) -> bool:
        result = await cls.get_collection().update_one(
            {"id": id_value},
            {"$inc": {"walletBalance": amount}}
        )
        return result.modified_count > 0
