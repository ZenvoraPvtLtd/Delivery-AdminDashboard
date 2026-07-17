import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, OperationFailure

logger = logging.getLogger("delivery_admin.database")

# Default Atlas URI pattern if env is not configured
MONGODB_URI_TEMPLATE = "mongodb+srv://rsen95759:{}@cluster0.icrcr5k.mongodb.net/?appName=Cluster0"
DEFAULT_DB_NAME = "delivery_db"

class Database:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect(cls):
        """
        Connect to MongoDB Atlas using connection pooling and auto-recovery of passwords.
        """
        uri = os.getenv("MONGODB_URI")
        db_name = os.getenv("DATABASE_NAME", DEFAULT_DB_NAME)

        if uri and "<db_password>" not in uri:
            try:
                cls.client = AsyncIOMotorClient(
                    uri,
                    maxPoolSize=50,
                    minPoolSize=10,
                    serverSelectionTimeoutMS=5000
                )
                cls.db = cls.client[db_name]
                await cls.client.admin.command('ping')
                logger.info(f"Connected to MongoDB Atlas database '{db_name}' successfully.")
                await cls.create_indexes()
                return
            except Exception as e:
                logger.error(f"Failed to connect using env MONGODB_URI: {e}")

        # Auto-detect which candidate password works
        passwords = ["Mp09zz4160", "mp09zz4160"]
        for pwd in passwords:
            test_uri = MONGODB_URI_TEMPLATE.format(pwd)
            try:
                logger.info(f"Attempting MongoDB connection with candidate password: {pwd}")
                client = AsyncIOMotorClient(
                    test_uri,
                    maxPoolSize=50,
                    minPoolSize=10,
                    serverSelectionTimeoutMS=4000
                )
                await client.admin.command('ping')
                cls.client = client
                cls.db = client[db_name]
                logger.info(f"Connected successfully to MongoDB Atlas using password '{pwd}'. Database: '{db_name}'")
                await cls.create_indexes()
                return
            except Exception as e:
                logger.warning(f"Password '{pwd}' failed to connect to Atlas cluster: {e}")

        raise ConnectionFailure("Could not establish a connection to MongoDB Atlas using the provided credentials.")

    @classmethod
    async def close(cls):
        """
        Gracefully close the client connection.
        """
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection pool closed.")

    @classmethod
    async def create_indexes(cls):
        """
        Create compound and single-field indexes for performance optimization.
        """
        try:
            # Customers indexes
            await cls.db.customers.create_index("phone", unique=True)
            await cls.db.customers.create_index("email", unique=True)

            # Orders indexes
            await cls.db.orders.create_index("id", unique=True)
            await cls.db.orders.create_index([("customerId", 1), ("status", 1)])
            await cls.db.orders.create_index("createdAt")

            # Products indexes
            await cls.db.products.create_index("id", unique=True)
            await cls.db.products.create_index("category")

            # Delivery Partners indexes
            await cls.db.delivery_partners.create_index("id", unique=True)
            await cls.db.delivery_partners.create_index("status")

            # Notifications outbox indexes
            await cls.db.notifications.create_index("id", unique=True)
            await cls.db.notifications.create_index([("order_id", 1), ("provider", 1)])

            # Coupons indexes
            await cls.db.coupons.create_index("code", unique=True)

            # Banners/Offers indexes
            await cls.db.offers.create_index("id", unique=True)

            logger.info("MongoDB database collections and indexes initialized successfully.")
        except OperationFailure as e:
            logger.warning(f"Non-blocking index creation warning: {e}")
