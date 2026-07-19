from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from app.security.jwt import verify_token
from app.repositories.user import user_repository
from app.models.user import User
from app.constants.roles import Role
from app.core.exceptions import BaseAPIException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    payload = verify_token(token)
    if not payload:
        raise BaseAPIException("Invalid or expired token", status_code=401)
        
    user_id = payload.get("sub")
    if not user_id:
        raise BaseAPIException("Invalid token payload", status_code=401)
        
    user = await user_repository.get_by_id(user_id)
    if not user:
        raise BaseAPIException("User not found", status_code=404)
        
    if user.status != "active":
        raise BaseAPIException("User account is disabled", status_code=403)
        
    return user

class RoleChecker:
    def __init__(self, allowed_roles: list[Role]):
        self.allowed_roles = allowed_roles
        
    async def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise BaseAPIException("Operation not permitted", status_code=403)
        return current_user
