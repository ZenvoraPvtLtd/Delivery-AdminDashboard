from typing import List
from app.schemas.user import CreateUserRequest, UpdateUserRequest, UserResponse
from app.models.user import User
from app.repositories.user import user_repository
from app.repositories.role import role_repository
from app.repositories.audit import audit_repository
from app.models.audit import AuditLog
from app.security.password import get_password_hash
from app.core.exceptions import BaseAPIException
from datetime import datetime, timezone

class UserService:
    async def create_user(self, data: CreateUserRequest, current_user: User, request_info: dict) -> UserResponse:
        existing_user = await user_repository.get_by_email(data.email)
        if existing_user:
            raise BaseAPIException("Email already registered", status_code=409)
            
        # Validate Role exists
        role = await role_repository.get_by_name(data.role.value)
        if not role:
            raise BaseAPIException("Invalid role", status_code=422)
            
        hashed_password = get_password_hash(data.password)
        
        user = User(
            full_name=data.full_name,
            email=data.email,
            mobile_number=data.mobile_number,
            password_hash=hashed_password,
            role_id=str(role.id),
            created_by=current_user.user_id
        )
        
        created_user = await user_repository.create(user)
        
        await self._log_audit(current_user.user_id, "user", "create", None, user.model_dump(exclude={"password_hash"}), request_info)
        return self._map_to_response(created_user)

    async def get_user(self, user_id: str) -> UserResponse:
        user = await user_repository.get_by_id(user_id)
        if not user:
            raise BaseAPIException("User not found", status_code=404)
        return self._map_to_response(user)
        
    async def get_all_users(self) -> List[UserResponse]:
        users = await user_repository.get_all()
        return [self._map_to_response(u) for u in users]

    async def update_user(self, user_id: str, data: UpdateUserRequest, current_user: User, request_info: dict) -> UserResponse:
        user = await user_repository.get_by_id(user_id)
        if not user:
            raise BaseAPIException("User not found", status_code=404)
            
        old_data = user.model_dump(exclude={"password_hash"})
        update_data = data.model_dump(exclude_unset=True)
        
        if "role" in update_data:
            role = await role_repository.get_by_name(update_data["role"].value)
            if not role:
                raise BaseAPIException("Invalid role", status_code=422)
            update_data["role_id"] = str(role.id)
            del update_data["role"]
            
        for key, value in update_data.items():
            setattr(user, key, value)
            
        user.updated_at = datetime.now(timezone.utc)
        user.updated_by = current_user.user_id
        updated_user = await user_repository.update(user)
        
        await self._log_audit(current_user.user_id, "user", "update", old_data, updated_user.model_dump(exclude={"password_hash"}), request_info)
        return self._map_to_response(updated_user)

    async def delete_user(self, user_id: str, current_user: User, request_info: dict):
        user = await user_repository.get_by_id(user_id)
        if not user:
            raise BaseAPIException("User not found", status_code=404)
            
        old_data = user.model_dump(exclude={"password_hash"})
        await user_repository.delete(user_id)
        await self._log_audit(current_user.user_id, "user", "delete", old_data, None, request_info)

    def _map_to_response(self, user: User) -> UserResponse:
        from app.constants.roles import Role as RoleEnum
        role_val = RoleEnum.SUPER_ADMIN
        if user.role_id:
            raw = str(user.role_id).lower()
            if "support" in raw:
                role_val = RoleEnum.SUPPORT
            elif "manager" in raw:
                role_val = RoleEnum.MANAGER
            elif "admin" in raw:
                role_val = RoleEnum.ADMIN
            elif "super" in raw:
                role_val = RoleEnum.SUPER_ADMIN
            else:
                for r in RoleEnum:
                    if r.value == user.role_id:
                        role_val = r
                        break

        return UserResponse(
            id=user.user_id,
            full_name=user.full_name,
            email=user.email,
            mobile_number=user.mobile_number,
            role=role_val,
            status=user.status,
            is_verified=user.is_verified,
            last_login=user.last_login,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

    async def _log_audit(self, user_id: str, module: str, action: str, old_data: dict, new_data: dict, request_info: dict):
        log = AuditLog(
            user_id=user_id,
            module=module,
            action=action,
            old_data=old_data,
            new_data=new_data,
            ip=request_info.get("ip", "unknown"),
            browser=request_info.get("browser", "unknown"),
            device=request_info.get("device", "unknown"),
            endpoint=request_info.get("endpoint", "unknown"),
            request_method=request_info.get("method", "unknown")
        )
        await audit_repository.create(log)

user_service = UserService()
