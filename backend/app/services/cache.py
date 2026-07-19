from typing import Any, Optional
import time
from loguru import logger

class CacheService:
    def __init__(self):
        self._cache = {}
        self._ttl = {}
        logger.info("Initialized In-Memory Cache Service (Redis hook ready)")
        
    async def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            if time.time() > self._ttl.get(key, 0):
                await self.delete(key)
                return None
            return self._cache[key]
        return None
        
    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        self._cache[key] = value
        self._ttl[key] = time.time() + ttl_seconds
        
    async def delete(self, key: str) -> None:
        if key in self._cache:
            del self._cache[key]
        if key in self._ttl:
            del self._ttl[key]
            
cache_service = CacheService()
