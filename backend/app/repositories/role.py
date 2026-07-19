from typing import Optional, List
from app.models.role import Role

class RoleRepository:
    async def get_by_name(self, role_name: str) -> Optional[Role]:
        return await Role.find_one(Role.role_name == role_name)
        
    async def get_by_id(self, role_id: str) -> Optional[Role]:
        return await Role.get(role_id)
        
    async def create(self, role: Role) -> Role:
        return await role.insert()
        
    async def get_all(self) -> List[Role]:
        return await Role.find_all().to_list()

role_repository = RoleRepository()
