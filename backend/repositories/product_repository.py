from repositories.base_repository import BaseRepository
from typing import List, Dict, Any

class ProductRepository(BaseRepository):
    collection_name = "products"

    @classmethod
    async def get_by_category(cls, category: str) -> List[Dict[str, Any]]:
        cursor = cls.get_collection().find({"category": category, "is_deleted": False})
        return await cursor.to_list(length=100)

    @classmethod
    async def get_available(cls) -> List[Dict[str, Any]]:
        cursor = cls.get_collection().find({"availability": True, "is_deleted": False})
        return await cursor.to_list(length=100)
