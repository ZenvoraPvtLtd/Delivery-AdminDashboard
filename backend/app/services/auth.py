from datetime import datetime, timezone, timedelta
from typing import Optional
from app.schemas.auth import LoginRequest, LoginResponse, TokenResponse, RefreshTokenRequest, ChangePasswordRequest
from app.repositories.user import user_repository
from app.repositories.token import refresh_token_repository
from app.repositories.audit import audit_repository
from app.security.password import verify_password, get_password_hash
from app.security.jwt import create_access_token, create_refresh_token, verify_token
from app.core.exceptions import BaseAPIException
from app.models.user import User
from app.models.token import RefreshToken
from app.models.audit import AuditLog
from app.core.config import settings

class AuthService:
    async def login(self, data: LoginRequest, request_info: dict) -> LoginResponse:
        user = await user_repository.get_by_email(data.email)
        if not user:
            raise BaseAPIException("Invalid credentials", status_code=401)
            
        if user.account_locked:
            raise BaseAPIException("Account locked", status_code=403)
            
        if not verify_password(data.password, user.password_hash):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.account_locked = True
            await user_repository.update(user)
            await self._log_audit(user.user_id, "auth", "failed_login", request_info)
            raise BaseAPIException("Invalid credentials", status_code=401)
            
        if user.status != "active":
            raise BaseAPIException("Account is disabled", status_code=403)
            
        # Reset attempts and update last login
        user.failed_login_attempts = 0
        user.last_login = datetime.now(timezone.utc)
        await user_repository.update(user)
        
        access_token = create_access_token(subject=str(user.user_id))
        refresh_token_str = create_refresh_token(subject=str(user.user_id))
        
        # Store refresh token in DB
        rt = RefreshToken(
            user_id=user.user_id,
            token=refresh_token_str,
            device=request_info.get("device", "unknown"),
            ip=request_info.get("ip", "unknown"),
            browser=request_info.get("browser", "unknown"),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        await refresh_token_repository.create(rt)
        
        await self._log_audit(user.user_id, "auth", "login", request_info)
        
        tokens = TokenResponse(access_token=access_token, refresh_token=refresh_token_str)
        return LoginResponse(message="Login successful", tokens=tokens)
        
    async def refresh_token(self, data: RefreshTokenRequest, request_info: dict) -> TokenResponse:
        # Check DB first
        token_doc = await refresh_token_repository.get_by_token(data.refresh_token)
        if not token_doc or token_doc.expires_at < datetime.now(timezone.utc):
            if token_doc:
                await refresh_token_repository.delete_by_token(data.refresh_token)
            raise BaseAPIException("Invalid or expired refresh token", status_code=401)
            
        payload = verify_token(data.refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise BaseAPIException("Invalid refresh token", status_code=401)
            
        user = await user_repository.get_by_id(token_doc.user_id)
        if not user or user.status != "active" or user.account_locked:
            raise BaseAPIException("Invalid user or disabled account", status_code=401)
            
        access_token = create_access_token(subject=str(user.user_id))
        new_refresh_token_str = create_refresh_token(subject=str(user.user_id))
        
        # Replace old refresh token
        await refresh_token_repository.delete_by_token(data.refresh_token)
        
        rt = RefreshToken(
            user_id=user.user_id,
            token=new_refresh_token_str,
            device=request_info.get("device", "unknown"),
            ip=request_info.get("ip", "unknown"),
            browser=request_info.get("browser", "unknown"),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        await refresh_token_repository.create(rt)
        
        return TokenResponse(access_token=access_token, refresh_token=new_refresh_token_str)
        
    async def logout(self, user_id: str, request_info: dict):
        await refresh_token_repository.delete_all_for_user(user_id)
        await self._log_audit(user_id, "auth", "logout", request_info)

    async def change_password(self, current_user: User, data: ChangePasswordRequest, request_info: dict):
        if not verify_password(data.old_password, current_user.password_hash):
            raise BaseAPIException("Incorrect old password", status_code=401)
            
        current_user.password_hash = get_password_hash(data.new_password)
        current_user.updated_at = datetime.now(timezone.utc)
        await user_repository.update(current_user)
        await self._log_audit(current_user.user_id, "auth", "password_change", request_info)

    async def _log_audit(self, user_id: str, module: str, action: str, request_info: dict):
        log = AuditLog(
            user_id=user_id,
            module=module,
            action=action,
            ip=request_info.get("ip", "unknown"),
            browser=request_info.get("browser", "unknown"),
            device=request_info.get("device", "unknown"),
            endpoint=request_info.get("endpoint", "unknown"),
            request_method=request_info.get("method", "unknown")
        )
        await audit_repository.create(log)

auth_service = AuthService()
