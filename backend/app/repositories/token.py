from typing import Optional
from app.models.token import RefreshToken

class RefreshTokenRepository:
    async def get_by_token(self, token: str) -> Optional[RefreshToken]:
        return await RefreshToken.find_one(RefreshToken.token == token)
        
    async def create(self, token: RefreshToken) -> RefreshToken:
        return await token.insert()
        
    async def delete_by_token(self, token: str) -> bool:
        refresh_token = await self.get_by_token(token)
        if refresh_token:
            await refresh_token.delete()
            return True
        return False
        
    async def delete_all_for_user(self, user_id: str):
        await RefreshToken.find(RefreshToken.user_id == user_id).delete()

refresh_token_repository = RefreshTokenRepository()
