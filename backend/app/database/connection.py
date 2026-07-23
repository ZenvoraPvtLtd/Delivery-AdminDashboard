from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from beanie import init_beanie
from loguru import logger
from app.core.config import settings

from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission
from app.models.token import RefreshToken
from app.models.audit import AuditLog
from app.models.customer import Customer, CustomerAddress, CustomerWalletTransaction, CustomerNote, CustomerActivityLog
from app.models.delivery_partner import (
    DeliveryPartner, DeliveryPartnerVehicle, DeliveryPartnerLocation, 
    DeliveryPartnerEarning, DeliveryPartnerActivityLog
)
from app.models.product import Category, Brand, Product
from app.models.inventory import Supplier, InventoryItem, InventoryTransaction, PurchaseOrder
from app.models.payment import Payment, Wallet, WalletTransaction, Refund, Settlement
from app.models.support import Review, Complaint, SupportTicket, SLAPolicy
from app.models.promotion import Coupon, Offer, CustomerReward, ReferralProgram, GiftVoucher
from app.models.cms import Banner, MediaLibrary, WebsitePage, AnnouncementBar, Popup, SEOSetting, NavigationMenu
from app.models.analytics import ReportTemplate, ScheduledReport, ReportExport, AnalyticsSnapshot, DashboardWidget
from app.models.settings import BusinessSetting, ApiConfiguration, DatabaseBackup
from app.models.communication import EmailTemplate, SmsTemplate, ProviderConfig
from app.models.communication_logs import CommunicationLog, ConversationThread
from app.models.order import Order
from app.models.outlet import Outlet

async def init_db():
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
        client = AsyncIOMotorClient(
            settings.MONGODB_URL, 
            tls=True, 
            tlsAllowInvalidCertificates=True
        )
        database = client[settings.DATABASE_NAME]
        
        # Verify connection
        await client.admin.command('ping')
        logger.info("MongoDB pinged successfully.")
        
        # Register Document Models
        models = [
            User,
            Role,
            Permission,
            RefreshToken,
            AuditLog,
            Customer,
            CustomerAddress,
            CustomerWalletTransaction,
            CustomerNote,
            CustomerActivityLog,
            DeliveryPartner,
            DeliveryPartnerVehicle,
            DeliveryPartnerLocation,
            DeliveryPartnerLocation,
            DeliveryPartnerEarning,
            DeliveryPartnerActivityLog,
            Category,
            Brand,
            Product,
            Supplier,
            InventoryItem,
            InventoryTransaction,
            PurchaseOrder,
            Payment,
            Wallet,
            WalletTransaction,
            Refund,
            Settlement,
            Review,
            Complaint,
            SupportTicket,
            SLAPolicy,
            Coupon,
            Offer,
            CustomerReward,
            ReferralProgram,
            GiftVoucher,
            Banner,
            MediaLibrary,
            WebsitePage,
            AnnouncementBar,
            Popup,
            SEOSetting,
            NavigationMenu,
            ReportTemplate,
            ScheduledReport,
            ReportExport,
            AnalyticsSnapshot,
            DashboardWidget,
            BusinessSetting,
            ApiConfiguration,
            DatabaseBackup,
            EmailTemplate,
            SmsTemplate,
            ProviderConfig,
            CommunicationLog,
            ConversationThread,
            Order,
            Outlet
        ]
        
        await init_beanie(
            database=database,
            document_models=models
        )
        logger.info("MongoDB and Beanie ODM initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise e
