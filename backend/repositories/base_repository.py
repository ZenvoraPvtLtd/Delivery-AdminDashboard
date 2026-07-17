from database import Database
from typing import List, Dict, Any, Optional

class BaseRepository:
    collection_name: str = ""

    @classmethod
    def get_collection(cls):
        return Database.db[cls.collection_name]

    @classmethod
    async def get_all(cls, query: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        query = query or {}
        query["is_deleted"] = query.get("is_deleted", False)
        cursor = cls.get_collection().find(query)
        return await cursor.to_list(length=1000)

    @classmethod
    async def get_by_id(cls, id_value: str, id_field: str = "id") -> Optional[Dict[str, Any]]:
        return await cls.get_collection().find_one({id_field: id_value, "is_deleted": False})

    @classmethod
    async def create(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        data["is_deleted"] = data.get("is_deleted", False)
        await cls.get_collection().insert_one(data)
        return data

    @classmethod
    async def update(cls, id_value: str, update_data: Dict[str, Any], id_field: str = "id") -> bool:
        result = await cls.get_collection().update_one(
            {id_field: id_value},
            {"$set": update_data}
        )
        return result.modified_count > 0

    @classmethod
    async def delete(cls, id_value: str, id_field: str = "id") -> bool:
        result = await cls.get_collection().update_one(
            {id_field: id_value},
            {"$set": {"is_deleted": True}}
        )
        return result.modified_count > 0
