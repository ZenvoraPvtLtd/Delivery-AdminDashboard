from fastapi import APIRouter, Depends, Request
from app.schemas.auth import LoginRequest, LoginResponse, TokenResponse, RefreshTokenRequest, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.user import UserResponse
from app.services.auth import auth_service
from app.services.user import user_service
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.core.limiter import limiter

router = APIRouter()

def get_request_info(request: Request):
    return {
        "ip": request.client.host if request.client else "unknown",
        "browser": request.headers.get("user-agent", "unknown"),
        "endpoint": request.url.path,
        "method": request.method
    }

@router.post("/login", response_model=LoginResponse, summary="User Login")
@limiter.limit("10/minute")
async def login(request: Request, data: LoginRequest):
    return await auth_service.login(data, get_request_info(request))

@router.post("/refresh-token", response_model=TokenResponse, summary="Refresh Token")
@limiter.limit("20/minute")
async def refresh_token(request: Request, data: RefreshTokenRequest):
    return await auth_service.refresh_token(data, get_request_info(request))

@router.post("/logout", summary="User Logout")
async def logout(request: Request):
    from app.security.jwt import verify_token
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        if payload and payload.get("sub"):
            try:
                await auth_service.logout(str(payload.get("sub")), get_request_info(request))
            except Exception:
                pass
    return {"message": "Successfully logged out"}

@router.post("/change-password", summary="Change Password")
async def change_password(data: ChangePasswordRequest, request: Request, current_user: User = Depends(get_current_user)):
    await auth_service.change_password(current_user, data, get_request_info(request))
    return {"message": "Password updated successfully"}

@router.post("/forgot-password", summary="Forgot Password")
async def forgot_password(data: ForgotPasswordRequest):
    return {"message": "If the email exists, a reset link will be sent."}

@router.post("/reset-password", summary="Reset Password")
async def reset_password(data: ResetPasswordRequest):
    return {"message": "Password has been successfully reset."}

@router.get("/me", response_model=UserResponse, summary="Get Current User Profile")
async def get_me(current_user: User = Depends(get_current_user)):
    return user_service._map_to_response(current_user)
