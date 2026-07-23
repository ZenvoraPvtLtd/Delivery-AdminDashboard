from fastapi import APIRouter, Depends
from typing import Optional, List, Any
from datetime import datetime, timezone
from pydantic import BaseModel
from app.models.audit import AuditLog
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

class AuditLogCreate(BaseModel):
    username: str
    role: str
    action: str
    module: str
    ipAddress: Optional[str] = "127.0.0.1"
    browser: Optional[str] = "Admin Console"

@router.get("", summary="Get Audit Logs")
async def get_audit_logs(current_user: User = Depends(get_current_user)) -> Any:
    logs = await AuditLog.find_all().sort("-timestamp").limit(100).to_list()
    res = []
    for l in logs:
        res.append({
            "id": str(l.id),
            "username": l.user_id or "Admin",
            "role": "Super Admin",
            "action": l.action,
            "module": l.module,
            "ipAddress": l.ip,
            "browser": l.browser,
            "timestamp": l.timestamp.isoformat() if isinstance(l.timestamp, datetime) else str(l.timestamp)
        })
    return res

@router.post("", summary="Create Audit Log Entry")
async def create_audit_log(data: AuditLogCreate, current_user: User = Depends(get_current_user)) -> Any:
    new_log = AuditLog(
        user_id=data.username,
        module=data.module,
        action=data.action,
        browser=data.browser or "Admin Console",
        ip=data.ipAddress or "127.0.0.1"
    )
    await new_log.insert()
    return {
        "id": str(new_log.id),
        "username": data.username,
        "role": data.role,
        "action": data.action,
        "module": data.module,
        "ipAddress": data.ipAddress,
        "browser": data.browser,
        "timestamp": new_log.timestamp.isoformat()
    }
