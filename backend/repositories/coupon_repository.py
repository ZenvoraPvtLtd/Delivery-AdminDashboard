from repositories.base_repository import BaseRepository
from typing import Optional, Dict, Any

class CouponRepository(BaseRepository):
    collection_name = "coupons"

    @classmethod
    async def get_by_code(cls, code: str) -> Optional[Dict[str, Any]]:
        return await cls.get_collection().find_one({
            "code": code.upper().strip(),
            "is_deleted": False
        })

    @classmethod
    async def increment_usage(cls, code: str) -> bool:
        result = await cls.get_collection().update_one(
            {"code": code.upper().strip()},
            {"$inc": {"usageCount": 1}}
        )
        return result.modified_count > 0
