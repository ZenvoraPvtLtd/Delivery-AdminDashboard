import json
import os
import logging
from typing import List, Dict, Any, Optional
from database import Database

logger = logging.getLogger("delivery_admin.base_repository")

# Path to the local fallback db.json file
DB_JSON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
    "db.json"
)

# Mapping repository collection names to their respective keys inside db.json
COLLECTION_TO_JSON_KEY = {
    "orders": "orders",
    "customers": "customers",
    "products": "products",
    "delivery_partners": "deliveryPartners",
    "coupons": "coupons",
    "raw_materials": "rawMaterials",
    "tickets": "tickets",
    "audit_logs": "auditLogs",
    "offers": "banners",
    "settings": "communicationSettings",
    "notifications": "notifications",
    "conversations": "conversations"
}

def load_local_db() -> dict:
    if os.path.exists(DB_JSON_PATH):
        try:
            with open(DB_JSON_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"[Fallback Storage] Failed to load local db.json: {e}")
    return {}

def save_local_db(data: dict):
    try:
        with open(DB_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"[Fallback Storage] Failed to save local db.json: {e}")

class BaseRepository:
    collection_name: str = ""

    @classmethod
    def get_collection(cls):
        if Database.is_mock:
            return None
        return Database.db[cls.collection_name]

    @classmethod
    async def get_all(cls, query: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        query = query or {}
        # Exclude logically deleted elements unless specified
        is_del = query.get("is_deleted", False)
        
        if Database.is_mock:
            db_data = load_local_db()
            key = COLLECTION_TO_JSON_KEY.get(cls.collection_name, cls.collection_name)
            items = db_data.get(key, [])
            if not isinstance(items, list):
                return []
            
            filtered = []
            for item in items:
                # Filter logically deleted
                if item.get("is_deleted", False) != is_del:
                    continue
                
                # Filter by simple query fields matching
                match = True
                for qk, qv in query.items():
                    if qk == "is_deleted":
                        continue
                    # Handle dict checks (e.g. mongo operators)
                    if isinstance(qv, dict):
                        if "$ne" in qv:
                            if item.get(qk) == qv["$ne"]:
                                match = False
                                break
                    elif item.get(qk) != qv:
                        match = False
                        break
                
                if match:
                    # Clean copy
                    filtered.append(dict(item))
            return filtered

        query["is_deleted"] = is_del
        cursor = cls.get_collection().find(query)
        return await cursor.to_list(length=1000)

    @classmethod
    async def get_by_id(cls, id_value: str, id_field: str = "id") -> Optional[Dict[str, Any]]:
        if Database.is_mock:
            db_data = load_local_db()
            key = COLLECTION_TO_JSON_KEY.get(cls.collection_name, cls.collection_name)
            
            # For settings dictionary single doc
            if key == "communicationSettings":
                settings = db_data.get(key, {})
                return settings if settings.get(id_field) == id_value else None
                
            items = db_data.get(key, [])
            for item in items:
                if item.get(id_field) == id_value and not item.get("is_deleted", False):
                    return dict(item)
            return None

        return await cls.get_collection().find_one({id_field: id_value, "is_deleted": False})

    @classmethod
    async def create(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        data["is_deleted"] = data.get("is_deleted", False)
        
        if Database.is_mock:
            db_data = load_local_db()
            key = COLLECTION_TO_JSON_KEY.get(cls.collection_name, cls.collection_name)
            
            if key == "communicationSettings":
                db_data[key] = data
            else:
                db_data.setdefault(key, []).append(data)
                
            save_local_db(db_data)
            return data

        await cls.get_collection().insert_one(data)
        return data

    @classmethod
    async def update(cls, id_value: str, update_data: Dict[str, Any], id_field: str = "id") -> bool:
        if Database.is_mock:
            db_data = load_local_db()
            key = COLLECTION_TO_JSON_KEY.get(cls.collection_name, cls.collection_name)
            
            if key == "communicationSettings":
                db_data[key] = {**db_data.get(key, {}), **update_data}
                save_local_db(db_data)
                return True
                
            items = db_data.get(key, [])
            updated = False
            for item in items:
                if item.get(id_field) == id_value:
                    for k, v in update_data.items():
                        item[k] = v
                    updated = True
            if updated:
                save_local_db(db_data)
            return updated

        result = await cls.get_collection().update_one(
            {id_field: id_value},
            {"$set": update_data}
        )
        return result.modified_count > 0

    @classmethod
    async def delete(cls, id_value: str, id_field: str = "id") -> bool:
        if Database.is_mock:
            return await cls.update(id_value, {"is_deleted": True}, id_field=id_field)

        result = await cls.get_collection().update_one(
            {id_field: id_value},
            {"$set": {"is_deleted": True}}
        )
        return result.modified_count > 0
