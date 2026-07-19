from typing import Optional, List
from app.models.permission import Permission

class PermissionRepository:
    async def get_by_name(self, permission_name: str) -> Optional[Permission]:
        return await Permission.find_one(Permission.permission_name == permission_name)
        
    async def create(self, permission: Permission) -> Permission:
        return await permission.insert()
        
    async def get_all(self) -> List[Permission]:
        return await Permission.find_all().to_list()

permission_repository = PermissionRepository()
