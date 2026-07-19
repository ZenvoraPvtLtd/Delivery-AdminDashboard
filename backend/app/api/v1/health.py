from fastapi import APIRouter
from app.core.config import settings
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

@router.get("/health", response_model=dict)
async def liveness_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "message": "Liveness probe OK"
    }

@router.get("/health/readiness", response_model=dict)
async def readiness_check():
    mongo_status = "disconnected"
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000, tls=True, tlsAllowInvalidCertificates=True)
        await client.admin.command('ping')
        mongo_status = "connected"
    except Exception:
        pass

    cloudinary_status = "configured" if settings.CLOUDINARY_URL else "missing"
    twilio_status = "configured" if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN else "missing"

    is_ready = mongo_status == "connected"
    
    return {
        "status": "ready" if is_ready else "not_ready",
        "database": mongo_status,
        "cloudinary": cloudinary_status,
        "twilio": twilio_status,
        "version": "1.0.0"
    }
