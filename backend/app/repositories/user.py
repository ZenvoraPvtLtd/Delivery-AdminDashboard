from typing import Optional, List
from app.models.user import User

class UserRepository:
    async def get_by_email(self, email: str) -> Optional[User]:
        return await User.find_one(User.email == email)
        
    async def get_by_id(self, user_id: str) -> Optional[User]:
        return await User.find_one(User.user_id == user_id)
        
    async def create(self, user: User) -> User:
        return await user.insert()
        
    async def update(self, user: User) -> User:
        return await user.save()
        
    async def delete(self, user_id: str) -> bool:
        user = await self.get_by_id(user_id)
        if user:
            await user.delete()
            return True
        return False
        
    async def get_all(self) -> List[User]:
        return await User.find_all().to_list()

user_repository = UserRepository()
