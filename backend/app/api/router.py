from fastapi import APIRouter
# Router initialization
from app.api.v1 import health
from app.api.v1 import auth
from app.api.v1 import users
from app.api.v1 import dashboard
from app.api.v1 import customers
from app.api.v1 import delivery_partners
from app.api.v1 import products
from app.api.v1 import inventory
from app.api.v1 import payments
from app.api.v1 import support
from app.api.v1 import promotions
from app.api.v1 import cms
from app.api.v1 import analytics
from app.api.v1 import settings
from app.api.v1 import users_roles
from app.api.v1 import twilio_webhooks
from app.api.v1 import order_confirmation
from app.api.v1 import orders
from app.api.v1 import outlets
from app.api.v1 import audit

api_router = APIRouter()

api_router.include_router(health.router, prefix="/v1", tags=["Health"])
api_router.include_router(auth.router, prefix="/v1/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/v1/users", tags=["Users"])
api_router.include_router(dashboard.router, prefix="/v1/dashboard", tags=["Dashboard"])
api_router.include_router(customers.router, prefix="/v1/customers", tags=["Customers"])
api_router.include_router(delivery_partners.router, prefix="/v1/delivery-partners", tags=["Delivery Partners"])
api_router.include_router(products.router, prefix="/v1/products", tags=["Products"])
api_router.include_router(inventory.router, prefix="/v1/inventory", tags=["Inventory"])
api_router.include_router(payments.router, prefix="/v1/payments", tags=["Payments"])
api_router.include_router(support.router, prefix="/v1/support", tags=["Support"])
api_router.include_router(promotions.router, prefix="/v1/promotions", tags=["Promotions"])
api_router.include_router(cms.router, prefix="/v1/cms", tags=["CMS"])
api_router.include_router(analytics.router, prefix="/v1/analytics", tags=["Analytics"])
api_router.include_router(settings.router, prefix="/v1/settings", tags=["Settings"])
api_router.include_router(users_roles.router, prefix="/v1/admin", tags=["UsersRoles"])
api_router.include_router(twilio_webhooks.router, prefix="/v1/webhook", tags=["Webhooks"])
api_router.include_router(order_confirmation.router, prefix="/v1", tags=["OrderConfirmation"])
api_router.include_router(orders.router, prefix="/v1/orders", tags=["Orders"])
api_router.include_router(outlets.router, prefix="/v1/outlets", tags=["Outlets"])
api_router.include_router(audit.router, prefix="/v1/audit-logs", tags=["AuditLogs"])
