from loguru import logger
from app.models.role import Role
from app.models.user import User
from app.constants.roles import Role as RoleEnum
from app.core.config import settings
from app.security.password import get_password_hash

async def run_seeder():
    logger.info("Running Database Seeder...")
    
    # 1. Seed Roles
    roles = [
        RoleEnum.SUPER_ADMIN,
        RoleEnum.ADMIN,
        RoleEnum.MANAGER,
        RoleEnum.SUPPORT
    ]
    
    super_admin_role_id = None
    
    for r in roles:
        existing_role = await Role.find_one({"role_name": r.value})
        if not existing_role:
            new_role = Role(role_name=r.value, description=f"Default {r.value} role")
            await new_role.insert()
            logger.info(f"Role seeded: {r.value}")
            if r.value == RoleEnum.SUPER_ADMIN.value:
                super_admin_role_id = str(new_role.id)
        else:
            if r.value == RoleEnum.SUPER_ADMIN.value:
                super_admin_role_id = str(existing_role.id)
                
    # 2. Seed Super Admin User
    existing_admin = await User.find_one({"email": settings.SUPER_ADMIN_EMAIL})
    if not existing_admin and super_admin_role_id:
        super_admin = User(
            full_name=settings.SUPER_ADMIN_NAME,
            email=settings.SUPER_ADMIN_EMAIL,
            mobile_number=settings.SUPER_ADMIN_MOBILE,
            password_hash=get_password_hash(settings.SUPER_ADMIN_PASSWORD),
            role_id=super_admin_role_id,
            is_verified=True,
            status="active"
        )
        await super_admin.insert()
        logger.info(f"Super Admin seeded: {settings.SUPER_ADMIN_EMAIL}")
        
    logger.info("Seeder completed.")
