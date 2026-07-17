from repositories.base_repository import BaseRepository
from database import Database
from typing import List, Dict, Any

class NotificationRepository(BaseRepository):
    collection_name = "notifications"

    @classmethod
    async def log_sms(cls, sms_data: Dict[str, Any]) -> Dict[str, Any]:
        sms_data["is_deleted"] = False
        if Database.is_mock:
            from repositories.base_repository import load_local_db, save_local_db
            db_data = load_local_db()
            db_data.setdefault("sms_logs", []).append(sms_data)
            save_local_db(db_data)
        else:
            await Database.db.sms_logs.insert_one(sms_data)
        return sms_data

    @classmethod
    async def log_whatsapp(cls, wa_data: Dict[str, Any]) -> Dict[str, Any]:
        wa_data["is_deleted"] = False
        if Database.is_mock:
            from repositories.base_repository import load_local_db, save_local_db
            db_data = load_local_db()
            db_data.setdefault("whatsapp_logs", []).append(wa_data)
            save_local_db(db_data)
        else:
            await Database.db.whatsapp_logs.insert_one(wa_data)
        return wa_data
