from typing import List
from fastapi import APIRouter, Depends, Request
from app.schemas.user import CreateUserRequest, UpdateUserRequest, UserResponse
from app.services.user import user_service
from app.dependencies.auth import RoleChecker, get_current_user
from app.constants.roles import Role
from app.models.user import User

router = APIRouter()

manage_users_dependency = RoleChecker([Role.SUPER_ADMIN, Role.ADMIN])

def get_request_info(request: Request):
    return {
        "ip": request.client.host if request.client else "unknown",
        "browser": request.headers.get("user-agent", "unknown"),
        "endpoint": request.url.path,
        "method": request.method
    }

@router.get("/", response_model=List[UserResponse], summary="Get All Users", dependencies=[Depends(manage_users_dependency)])
async def get_users():
    return await user_service.get_all_users()

@router.post("/", response_model=UserResponse, summary="Create a User", dependencies=[Depends(manage_users_dependency)])
async def create_user(data: CreateUserRequest, request: Request, current_user: User = Depends(get_current_user)):
    return await user_service.create_user(data, current_user, get_request_info(request))

@router.get("/{id}", response_model=UserResponse, summary="Get User by ID", dependencies=[Depends(manage_users_dependency)])
async def get_user(id: str):
    return await user_service.get_user(id)

@router.put("/{id}", response_model=UserResponse, summary="Update User by ID", dependencies=[Depends(manage_users_dependency)])
async def update_user(id: str, data: UpdateUserRequest, request: Request, current_user: User = Depends(get_current_user)):
    return await user_service.update_user(id, data, current_user, get_request_info(request))

@router.delete("/{id}", summary="Delete User by ID", dependencies=[Depends(manage_users_dependency)])
async def delete_user(id: str, request: Request, current_user: User = Depends(get_current_user)):
    await user_service.delete_user(id, current_user, get_request_info(request))
    return {"message": "User deleted successfully"}
