import os
import sys
import logging
import random
import time
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import socketio

# Ensure the server directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Structured logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("delivery_admin.main")

app = FastAPI(title="DelivoAdmin API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO Async Server Setup
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

# Database & Architecture Imports
from database import Database
from repositories.base_repository import BaseRepository
from repositories.customer_repository import CustomerRepository
from repositories.order_repository import OrderRepository
from repositories.product_repository import ProductRepository
from repositories.delivery_repository import DeliveryPartnerRepository
from repositories.coupon_repository import CouponRepository
from repositories.offer_repository import OfferRepository
from repositories.outlet_repository import OutletRepository
from services.order_service import OrderService
from services.delivery_service import DeliveryService
from services.notification_service import NotificationService
from webhooks.whatsapp import router as whatsapp_webhook_router

# Mount the WhatsApp webhook router
app.include_router(whatsapp_webhook_router)

# Initial mock data fallback (used to seed empty databases)
INITIAL_DB = {
  "outlets": [
    { "id": "out-1", "name": "Downtown Central Outlet", "address": "124 Market St, Downtown", "manager": "Sarah Jenkins", "phone": "+1 555-0192", "status": "Open", "revenue": 15480, "ordersCount": 420, "taxNumber": "GST-33AABCC1234D", "hours": "08:00 AM - 11:00 PM", "latitude": 40.7128, "longitude": -74.0060 },
    { "id": "out-2", "name": "West End Cafe", "address": "482 Broadway Rd, West End", "manager": "David Miller", "phone": "+1 555-0144", "status": "Open", "revenue": 9820, "ordersCount": 260, "taxNumber": "GST-33AABCC5678E", "hours": "09:00 AM - 10:00 PM", "latitude": 40.7198, "longitude": -74.0200 },
    { "id": "out-3", "name": "Metro Plaza Food Court", "address": "Suite 12, Metro Mall, Plaza St", "manager": "Elena Rostova", "phone": "+1 555-0188", "status": "Open", "revenue": 21300, "ordersCount": 650, "taxNumber": "GST-33AABCC9012F", "hours": "10:00 AM - 11:30 PM", "latitude": 40.7090, "longitude": -74.0010 },
    { "id": "out-4", "name": "North Suburbs Delivery Kitchen", "address": "Industrial Area Phase 2", "manager": "Rajesh Sharma", "phone": "+1 555-0165", "status": "Open", "revenue": 6400, "ordersCount": 180, "taxNumber": "GST-33AABCC4321G", "hours": "11:00 AM - 02:00 AM", "latitude": 40.7250, "longitude": -74.0200 }
  ],
  "products": [
    { "id": "prod-1", "name": "Truffle Mushroom Burger", "category": "Fast Food", "subcategory": "Burgers", "price": 12.99, "discount": 10, "availability": True, "preparationTime": 12, "isVeg": True, "isBestSeller": True, "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400", "outletIds": ["out-1", "out-2", "out-3"], "gstRate": 5, "description": "Freshly grilled portobello mushroom with melted cheese, truffle paste, and signature brioche bun." },
    { "id": "prod-2", "name": "Spicy Pepperoni Pizza (12\")", "category": "Italian", "subcategory": "Pizza", "price": 16.99, "discount": 0, "availability": True, "preparationTime": 18, "isVeg": False, "isBestSeller": True, "image": "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400", "outletIds": ["out-1", "out-3", "out-4"], "gstRate": 12, "description": "Crisp sourdough crust topped with premium pepperoni, hand-stretched mozzarella, and tangy marinara." },
    { "id": "prod-3", "name": "Avocado Toast with Poached Egg", "category": "Breakfast", "subcategory": "Toast", "price": 9.50, "discount": 5, "availability": True, "preparationTime": 8, "isVeg": True, "isBestSeller": False, "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400", "outletIds": ["out-1", "out-2"], "gstRate": 5, "description": "Smashed Haas avocados, flaky sea salt, organic eggs, sourdough bread toasted with organic butter." },
    { "id": "prod-4", "name": "Iced Vanilla Matcha Latte", "category": "Beverages", "subcategory": "Teas", "price": 5.99, "discount": 0, "availability": True, "preparationTime": 4, "isVeg": True, "isBestSeller": True, "image": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400", "outletIds": ["out-1", "out-2", "out-3", "out-4"], "gstRate": 5, "description": "Ceremonial grade Japanese Uji matcha whisked with organic oat milk and natural vanilla pod syrup." },
    { "id": "prod-5", "name": "Crispy Buffalo Wings (8pcs)", "category": "Snacks", "subcategory": "Appetizers", "price": 11.99, "discount": 15, "availability": True, "preparationTime": 15, "isVeg": False, "isBestSeller": False, "image": "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400", "outletIds": ["out-1", "out-3", "out-4"], "gstRate": 18, "description": "Spicy wings, glazed with signature hot sauce, served with blue cheese dip." },
    { "id": "prod-6", "name": "Premium Veggie Salad Bowl", "category": "Salads", "subcategory": "Healthy", "price": 10.99, "discount": 0, "availability": True, "preparationTime": 7, "isVeg": True, "isBestSeller": False, "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400", "outletIds": ["out-2", "out-3"], "gstRate": 5, "description": "Baby spinach, quinoa, cherry tomatoes, cucumbers, roasted chickpeas, organic feta, citrus vinaigrette." }
  ],
  "deliveryPartners": [
    { "id": "rider-1", "name": "John Doe", "phone": "+1 555-0211", "vehicleType": "Bike", "vehicleNumber": "MC-4592", "licenseVerified": True, "insuranceExpiry": "2027-04-12", "status": "Available", "rating": 4.8, "earnings": 420.50, "latitude": 40.7128, "longitude": -74.0060, "avatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100" },
    { "id": "rider-2", "name": "Alex Mercer", "phone": "+1 555-0233", "vehicleType": "Scooter", "vehicleNumber": "SC-8812", "licenseVerified": True, "insuranceExpiry": "2026-11-30", "status": "On Delivery", "rating": 4.9, "earnings": 580.20, "assignedOrderId": "order-102", "latitude": 40.7188, "longitude": -74.0120, "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
    { "id": "rider-3", "name": "Maria Gonzalez", "phone": "+1 555-0245", "vehicleType": "E-Bike", "vehicleNumber": "EB-2914", "licenseVerified": True, "insuranceExpiry": "2028-02-15", "status": "Available", "rating": 4.7, "earnings": 340.00, "latitude": 40.7090, "longitude": -74.0010, "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" },
    { "id": "rider-4", "name": "David Kim", "phone": "+1 555-0288", "vehicleType": "Bike", "vehicleNumber": "MC-1102", "licenseVerified": False, "insuranceExpiry": "2026-08-20", "status": "Offline", "rating": 4.2, "earnings": 180.00, "latitude": 40.7250, "longitude": -74.0200, "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100" }
  ],
  "orders": [
    {
      "id": "order-101",
      "customerId": "cust-1",
      "customerName": "Marcus Aurelius",
      "customerPhone": "+1 555-8921",
      "outletId": "out-1",
      "outletName": "Downtown Central Outlet",
      "items": [
        { "productId": "prod-1", "name": "Truffle Mushroom Burger", "quantity": 2, "price": 12.99, "isVeg": True },
        { "productId": "prod-4", "name": "Iced Vanilla Matcha Latte", "quantity": 1, "price": 5.99, "isVeg": True }
      ],
      "subtotal": 31.97,
      "tax": 1.60,
      "deliveryCharge": 2.99,
      "packagingCharge": 1.50,
      "discount": 3.20,
      "total": 34.86,
      "status": "Preparing",
      "paymentStatus": "Paid",
      "paymentMethod": "UPI",
      "createdAt": (datetime.now() - timedelta(hours=3)).isoformat(),
      "preparationTimeRemaining": 8,
      "address": "Apt 4B, 32 Wall Street, Financial District, NY",
      "orderType": "Delivery",
      "timeline": [
        { "status": "Pending", "timestamp": (datetime.now() - timedelta(hours=3)).isoformat(), "title": "Order Placed", "description": "Order successfully placed by customer." },
        { "status": "Pending", "timestamp": (datetime.now() - timedelta(hours=2.8)).isoformat(), "title": "Order Confirmed", "description": "Payment verified and order sent to Kitchen." },
        { "status": "Preparing", "timestamp": (datetime.now() - timedelta(hours=2.5)).isoformat(), "title": "Kitchen Accepted", "description": "Chef Sarah started preparing the items." }
      ],
      "confirmation_status": "Confirmed",
      "confirmed_at": (datetime.now() - timedelta(hours=2.8)).isoformat(),
      "confirmation_source": "whatsapp"
    },
    {
      "id": "order-102",
      "customerId": "cust-2",
      "customerName": "Clara Oswald",
      "customerPhone": "+1 555-4429",
      "outletId": "out-3",
      "outletName": "Metro Plaza Food Court",
      "items": [
        { "productId": "prod-2", "name": "Spicy Pepperoni Pizza (12\")", "quantity": 1, "price": 16.99, "isVeg": False }
      ],
      "subtotal": 16.99,
      "tax": 2.04,
      "deliveryCharge": 3.99,
      "packagingCharge": 1.00,
      "discount": 0,
      "total": 24.02,
      "status": "Out for Delivery",
      "paymentStatus": "Paid",
      "paymentMethod": "Card",
      "createdAt": (datetime.now() - timedelta(hours=1)).isoformat(),
      "deliveryPartnerId": "rider-2",
      "address": "Floor 14, 52 Hudson Yards, Midtown West, NY",
      "orderType": "Delivery",
      "timeline": [
        { "status": "Pending", "timestamp": (datetime.now() - timedelta(hours=1)).isoformat(), "title": "Order Placed", "description": "Order placed by customer." },
        { "status": "Pending", "timestamp": (datetime.now() - timedelta(hours=0.9)).isoformat(), "title": "Order Confirmed", "description": "Auto-accepted and routed to kitchen." },
        { "status": "Preparing", "timestamp": (datetime.now() - timedelta(hours=0.8)).isoformat(), "title": "Preparing", "description": "Oven heating, ingredients added." },
        { "status": "Ready", "timestamp": (datetime.now() - timedelta(hours=0.5)).isoformat(), "title": "Packed & Ready", "description": "Food packed in insulation container." },
        { "status": "Out for Delivery", "timestamp": (datetime.now() - timedelta(hours=0.2)).isoformat(), "title": "Handed Over to Rider", "description": "Rider Alex Mercer is transit with order." }
      ],
      "confirmation_status": "Confirmed",
      "confirmed_at": (datetime.now() - timedelta(hours=0.9)).isoformat(),
      "confirmation_source": "sms"
    }
  ],
  "coupons": [
    { "id": "cpn-1", "code": "WELCOME50", "discountType": "Flat", "value": 5.00, "minOrderValue": 15.00, "expiryDate": "2026-12-31", "usageCount": 42, "usageLimit": 500, "targetType": "All", "status": "Active" },
    { "id": "cpn-2", "code": "HAPPYHOUR20", "discountType": "Percentage", "value": 20, "minOrderValue": 20.00, "maxDiscount": 8.00, "expiryDate": "2026-08-30", "usageCount": 15, "usageLimit": 200, "targetType": "Outlet-wise", "status": "Active" },
    { "id": "cpn-3", "code": "FREEZE30", "discountType": "Percentage", "value": 30, "minOrderValue": 40.00, "expiryDate": "2026-06-01", "usageCount": 88, "usageLimit": 100, "targetType": "Customer-wise", "status": "Expired" }
  ],
  "rawMaterials": [
    { "id": "raw-1", "name": "Mozzarella Cheese", "category": "Dairy", "stock": 12.5, "unit": "kg", "minStockAlert": 15.0, "supplier": "Metro Dairy Farms", "expiryDate": "2026-07-22" },
    { "id": "raw-2", "name": "Haas Avocados", "category": "Produce", "stock": 35.0, "unit": "pcs", "minStockAlert": 10.0, "supplier": "Green Growers Co", "expiryDate": "2026-07-15" }
  ],
  "tickets": [
    { "id": "tkt-1", "orderId": "order-101", "customerId": "cust-1", "customerName": "Marcus Aurelius", "issueType": "Soggy food delivered", "priority": "High", "status": "Open", "messages": [
      { "sender": "customer", "text": "The burger bun was extremely soggy and cold when it arrived.", "timestamp": datetime.now().isoformat() }
    ]}
  ],
  "auditLogs": [],
  "customers": [
    { "id": "cust-1", "name": "Marcus Aurelius", "phone": "+1 555-8921", "email": "marcus@philosophy.com", "password": "password123", "walletBalance": 120.50, "rewardPoints": 1200, "status": "Active", "addresses": ["Apt 4B, 32 Wall Street, NY"], "favoriteItems": ["Truffle Mushroom Burger"] },
    { "id": "cust-2", "name": "Clara Oswald", "phone": "+1 555-4429", "email": "clara@tardis.co.uk", "password": "password123", "walletBalance": 45.00, "rewardPoints": 450, "status": "Active", "addresses": ["Floor 14, 52 Hudson Yards, NY"], "favoriteItems": ["Iced Vanilla Matcha Latte"] },
    { "id": "cust-3", "name": "Bruce Wayne", "phone": "+1 555-7700", "email": "bruce@waynecorp.com", "password": "password123", "walletBalance": 9800.00, "rewardPoints": 95000, "status": "Active", "addresses": ["Penthouse A, Wayne Tower, Manhattan, NY", "Wayne Manor, Bristol County, NJ"], "favoriteItems": ["Premium Veggie Salad Bowl"] }
  ],
  "banners": [
    { "id": "ban-1", "title": "Monsoon Combo 25% Off", "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600", "status": "Active", "type": "Homepage", "schedule": "2026-07-01 to 2026-07-31" },
    { "id": "ban-2", "title": "Delicious Matcha Weekend Special", "image": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600", "status": "Active", "type": "Offer", "schedule": "Saturday & Sunday" }
  ],
  "communicationSettings": {
    "enableWhatsapp": True,
    "enableSms": True,
    "defaultProvider": "meta",
    "whatsappProvider": "meta",
    "smsProvider": "twilio",
    "webhookSecret": "whsec_ZenvoraSecretToken2026",
    "retryCount": 3,
    "confirmationExpiry": 24,
    "apiKeys": {
      "metaToken": "mock-meta-token-xyz-98765",
      "twilioSid": "mock-twilio-sid-12345",
      "twilioAuthToken": "mock-twilio-auth-token-67890",
      "msg91Key": "mock-msg91-key-abcde",
      "textlocalKey": "mock-textlocal-key-fghij",
      "fast2smsKey": "mock-fast2sms-key-klmno"
    },
    "templates": {
      "confirmation": "Hello {{CustomerName}}, please confirm your Delivo Order #{{OrderID}} of {{Items}} totaling ${{Amount}}. Reply YES to Confirm or NO to Cancel.",
      "cancellation": "Hello {{CustomerName}}, your Delivo Order #{{OrderID}} has been cancelled successfully as requested. Refund initiated if prepaid.",
      "success": "Woohoo {{CustomerName}}! Your Order #{{OrderID}} is confirmed and heading to the kitchen. Tracker link will be sent soon.",
      "reminder": "Urgent {{CustomerName}}: Your Order #{{OrderID}} is awaiting confirmation. Reply YES/NO now to avoid auto-cancellation."
    }
  },
  "notifications": [],
  "conversations": []
}

async def seed_database():
    """
    Auto-seed database collection from INITIAL_DB snapshot if cluster is empty.
    """
    outlets_count = await Database.db.outlets.count_documents({})
    if outlets_count == 0:
        logger.info("MongoDB cluster collection is empty. Auto-seeding initial database snapshot...")
        
        # 1. Outlets
        await Database.db.outlets.insert_many([{**o, "is_deleted": False, "created_at": datetime.now(), "updated_at": datetime.now()} for o in INITIAL_DB["outlets"]])
        
        # 2. Products
        await Database.db.products.insert_many([{**p, "is_deleted": False, "created_at": datetime.now(), "updated_at": datetime.now()} for p in INITIAL_DB["products"]])
        
        # 3. Delivery Partners
        await Database.db.delivery_partners.insert_many([{**dp, "is_deleted": False, "created_at": datetime.now(), "updated_at": datetime.now()} for dp in INITIAL_DB["deliveryPartners"]])
        
        # 4. Orders
        await Database.db.orders.insert_many([{**o, "is_deleted": False, "created_at": datetime.now(), "updated_at": datetime.now()} for o in INITIAL_DB["orders"]])
        
        # 5. Coupons
        await Database.db.coupons.insert_many([{**c, "is_deleted": False, "created_at": datetime.now(), "updated_at": datetime.now()} for c in INITIAL_DB["coupons"]])
        
        # 6. Raw Materials
        await Database.db.raw_materials.insert_many([{**rm, "is_deleted": False, "created_at": datetime.now(), "updated_at": datetime.now()} for rm in INITIAL_DB["rawMaterials"]])
        
        # 7. Tickets
        await Database.db.tickets.insert_many([{**t, "is_deleted": False, "created_at": datetime.now(), "updated_at": datetime.now()} for t in INITIAL_DB["tickets"]])
        
        # 8. Customers
        await Database.db.customers.insert_many([{**cust, "is_deleted": False, "created_at": datetime.now(), "updated_at": datetime.now()} for cust in INITIAL_DB["customers"]])
        
        # 9. Banners
        await Database.db.offers.insert_many([{**b, "is_deleted": False, "created_at": datetime.now(), "updated_at": datetime.now()} for b in INITIAL_DB["banners"]])
        
        # 10. Settings
        await Database.db.settings.insert_one({**INITIAL_DB["communicationSettings"], "is_deleted": False, "created_at": datetime.now(), "updated_at": datetime.now()})

        logger.info("Database auto-seeding completed.")

async def load_db_async() -> dict:
    """
    Asynchronous bridge that retrieves MongoDB collections and generates a dictionary snapshot.
    Ensures absolute compatibility with chatbot.py and the frontend's /api/db endpoint.
    """
    db = Database.db
    if not db:
        return INITIAL_DB

    # Retrieve all collections
    outlets = await db.outlets.find({"is_deleted": False}).to_list(length=100)
    products = await db.products.find({"is_deleted": False}).to_list(length=100)
    riders = await db.delivery_partners.find({"is_deleted": False}).to_list(length=100)
    orders = await db.orders.find({"is_deleted": False}).sort("createdAt", -1).to_list(length=100)
    coupons = await db.coupons.find({"is_deleted": False}).to_list(length=100)
    raw_materials = await db.raw_materials.find({"is_deleted": False}).to_list(length=100)
    tickets = await db.tickets.find({"is_deleted": False}).to_list(length=100)
    audit_logs = await db.audit_logs.find({"is_deleted": False}).sort("timestamp", -1).to_list(length=100)
    customers = await db.customers.find({"is_deleted": False}).to_list(length=100)
    banners = await db.offers.find({"is_deleted": False}).to_list(length=100)
    notifications = await db.notifications.find({"is_deleted": False}).sort("sent_at", -1).to_list(length=500)
    conversations = await db.conversations.find({"is_deleted": False}).sort("timestamp", 1).to_list(length=500)

    settings_doc = await db.settings.find_one({"is_deleted": False})
    if not settings_doc:
        settings_doc = INITIAL_DB["communicationSettings"]

    # Stringify ObjectId fields for JSON compatibility
    def clean_docs(doc_list):
        cleaned = []
        for doc in doc_list:
            d = dict(doc)
            if "_id" in d:
                d["_id"] = str(d["_id"])
            cleaned.append(d)
        return cleaned

    return {
        "outlets": clean_docs(outlets),
        "products": clean_docs(products),
        "deliveryPartners": clean_docs(riders),
        "orders": clean_docs(orders),
        "coupons": clean_docs(coupons),
        "rawMaterials": clean_docs(raw_materials),
        "tickets": clean_docs(tickets),
        "auditLogs": clean_docs(audit_logs),
        "customers": clean_docs(customers),
        "banners": clean_docs(banners),
        "communicationSettings": clean_docs([settings_doc])[0] if settings_doc else {},
        "notifications": clean_docs(notifications),
        "conversations": clean_docs(conversations)
    }

# Sync wrapper for loading database fallback
def load_db() -> dict:
    """
    Sync wrapper to run async load_db_async in current thread execution loop.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Run in executor or another thread if loop is already busy
            return INITIAL_DB
        return loop.run_until_complete(load_db_async())
    except Exception:
        return INITIAL_DB

# Background Scheduler Monitor Loop
async def scheduler_loop():
    logger.info("[Scheduler] Asynchronous Order Confirmation Monitor started.")
    while True:
        try:
            await NotificationService.run_schedule_check()
        except Exception as e:
            logger.error(f"[Scheduler] Loop error: {e}")
        await asyncio.sleep(10)

@app.on_event("startup")
async def startup_event():
    await Database.connect()
    await seed_database()
    asyncio.create_task(scheduler_loop())

@app.on_event("shutdown")
async def shutdown_event():
    await Database.close()

# REST API Endpoints
@app.get("/api/db")
async def get_db_endpoint():
    return await load_db_async()

@app.get("/api/products")
async def get_products_endpoint():
    products = await ProductRepository.get_all()
    for p in products:
        p["_id"] = str(p["_id"])
    return products

@app.get("/api/banners")
async def get_banners_endpoint():
    banners = await OfferRepository.get_all()
    for b in banners:
        b["_id"] = str(b["_id"])
    return banners

@app.get("/api/coupons")
async def get_coupons_endpoint():
    coupons = await CouponRepository.get_all({"status": "Active"})
    for c in coupons:
        c["_id"] = str(c["_id"])
    return coupons

@app.get("/api/categories")
async def get_categories_endpoint():
    products = await ProductRepository.get_all()
    cat_names = sorted(list(set(p["category"] for p in products)))
    categories = []
    for idx, name in enumerate(cat_names):
        icon = "🍔"
        if "Italian" in name:
            icon = "🍕"
        elif "Breakfast" in name:
            icon = "🍳"
        elif "Beverages" in name:
            icon = "🥤"
        elif "Snacks" in name:
            icon = "🍿"
        elif "Salads" in name:
            icon = "🥗"
        categories.append({
            "id": f"cat-{idx + 1}",
            "name": name,
            "icon": icon
        })
    return categories

# Authentication Payloads
class LoginPayload(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None

class RegisterPayload(BaseModel):
    name: str
    email: str
    phone: str
    password: Optional[str] = None

class OtpPayload(BaseModel):
    phone: str
    code: str

@app.post("/api/auth/login")
async def login_endpoint(payload: LoginPayload):
    customer = None
    if payload.email:
        customer = await CustomerRepository.get_by_email(payload.email)
    elif payload.phone:
        customer = await CustomerRepository.get_by_phone(payload.phone)

    if not customer:
        customer = {
            "id": f"cust-{int(time.time() * 1000)}",
            "name": payload.email.split("@")[0] if payload.email else "New Foodie",
            "email": payload.email or "user@example.com",
            "phone": payload.phone or "+1 555-0000",
            "password": payload.password or "password",
            "walletBalance": 100.00,
            "rewardPoints": 200,
            "status": "Active",
            "addresses": [],
            "favoriteItems": [],
            "is_deleted": False,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        await CustomerRepository.create(customer)
    
    if "_id" in customer:
        customer["_id"] = str(customer["_id"])

    return {
        "success": True,
        "token": "jwt-mock-token-xyz-12345",
        "user": customer
    }

@app.post("/api/auth/register")
async def register_endpoint(payload: RegisterPayload):
    c_email = await CustomerRepository.get_by_email(payload.email)
    c_phone = await CustomerRepository.get_by_phone(payload.phone)
    if c_email or c_phone:
        raise HTTPException(status_code=400, detail="User already exists with this email or phone number.")

    customer = {
        "id": f"cust-{int(time.time() * 1000)}",
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "password": payload.password or "password123",
        "walletBalance": 50.00,
        "rewardPoints": 100,
        "status": "Active",
        "addresses": [],
        "favoriteItems": [],
        "is_deleted": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    await CustomerRepository.create(customer)
    customer["_id"] = str(customer["_id"])
    return {
        "success": True,
        "token": "jwt-mock-token-xyz-12345",
        "user": customer
    }

@app.post("/api/auth/verify-otp")
async def verify_otp_endpoint(payload: OtpPayload):
    if not payload.code or len(payload.code) != 6:
        raise HTTPException(status_code=400, detail="Invalid OTP format. Must be 6 digits.")

    customer = await CustomerRepository.get_by_phone(payload.phone)
    if not customer:
        customer = {
            "id": f"cust-{int(time.time() * 1000)}",
            "name": "SMS Customer",
            "email": f"{payload.phone.replace('+', '')}@delivo-mobile.com",
            "phone": payload.phone,
            "password": "password123",
            "walletBalance": 50.00,
            "rewardPoints": 100,
            "status": "Active",
            "addresses": [],
            "favoriteItems": [],
            "is_deleted": False,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        await CustomerRepository.create(customer)

    if "_id" in customer:
        customer["_id"] = str(customer["_id"])

    return {
        "success": True,
        "token": "jwt-mock-token-xyz-12345",
        "user": customer
    }

@app.get("/api/auth/profile")
async def get_profile_endpoint():
    customers = await CustomerRepository.get_all()
    if customers:
        customers[0]["_id"] = str(customers[0]["_id"])
        return customers[0]
    return {}

# Order Status and Assignment Payloads
class OrderStatusUpdate(BaseModel):
    status: str
    updatedBy: str

class RiderAssign(BaseModel):
    riderId: str
    updatedBy: str

@app.post("/api/orders/{order_id}/status")
async def update_order_status_endpoint(order_id: str, payload: OrderStatusUpdate):
    order = await OrderRepository.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    timeline_event = {
        "status": payload.status,
        "timestamp": datetime.now().isoformat(),
        "title": f"Status Updated to {payload.status}",
        "description": f"Order status set by {payload.updatedBy}."
    }
    
    update_fields = {"status": payload.status, "updated_at": datetime.now()}
    if payload.status == "Delivered":
        update_fields["paymentStatus"] = "Paid"
    elif payload.status == "Cancelled":
        update_fields["paymentStatus"] = "Refunded"

    await OrderRepository.update(order_id, update_fields)
    await OrderRepository.add_timeline_event(order_id, timeline_event)

    updated_order = await OrderRepository.get_by_id(order_id)
    updated_order["_id"] = str(updated_order["_id"])

    # Broadcast updates via socket
    await sio.emit("order_status", { "status": payload.status, "timeline": updated_order["timeline"] }, room=order_id)
    await sio.emit("order_confirmation_updated", updated_order)

    # Deliver SMS notification cascades
    try:
        settings_doc = await Database.db.settings.find_one({"is_deleted": False})
        await NotificationService.trigger_delivery_update_flow(updated_order, settings_doc or {}, payload.status)
    except Exception as e:
        logger.error(f"Failed to trigger status update outbox log: {e}")

    return {"success": True, "order": updated_order}

@app.post("/api/orders/{order_id}/assign-rider")
async def assign_rider_endpoint(order_id: str, payload: RiderAssign):
    order = await OrderRepository.get_by_id(order_id)
    rider = await DeliveryPartnerRepository.get_by_id(payload.riderId)

    if order and rider:
        await OrderRepository.update(order_id, {
            "deliveryPartnerId": payload.riderId,
            "status": "Out for Delivery",
            "updated_at": datetime.now()
        })
        
        timeline_event = {
            "status": "Out for Delivery",
            "timestamp": datetime.now().isoformat(),
            "title": "Dispatched with Rider",
            "description": f"Assigned to rider {rider['name']} by {payload.updatedBy}."
        }
        await OrderRepository.add_timeline_event(order_id, timeline_event)
        
        # Update rider status
        await DeliveryPartnerRepository.assign_order(payload.riderId, order_id)

        updated_order = await OrderRepository.get_by_id(order_id)
        updated_order["_id"] = str(updated_order["_id"])
        
        # Broadcast tracking updates
        await sio.emit("order_status", { "status": "Out for Delivery", "timeline": updated_order["timeline"] }, room=order_id)
        await sio.emit("order_confirmation_updated", updated_order)

        # Start coordinates stream simulation
        DeliveryService.start_simulation(order_id)

        return {"success": True, "order": updated_order, "rider": rider}
    raise HTTPException(status_code=404, detail="Order or Rider not found")

# Chatbot endpoint
class ChatMessage(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

@app.post("/api/chat")
async def chat_endpoint(payload: ChatRequest):
    try:
        from chatbot import answer_chat
        db = await load_db_async()
        result = await answer_chat(
            message=payload.message,
            history=[h.model_dump() for h in payload.history] if payload.history else [],
            db=db
        )
        return {"success": True, **result}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Customer Management Endpoints
class StatusUpdate(BaseModel):
    status: str

class WalletUpdate(BaseModel):
    amount: float

class AddressesUpdate(BaseModel):
    addresses: List[str]

@app.post("/api/customers/{customer_id}/status")
async def update_customer_status_endpoint(customer_id: str, payload: StatusUpdate):
    success = await CustomerRepository.update(customer_id, {"status": payload.status, "updated_at": datetime.now()})
    if success:
        c = await CustomerRepository.get_by_id(customer_id)
        c["_id"] = str(c["_id"])
        return {"success": True, "customer": c}
    raise HTTPException(status_code=404, detail="Customer not found")

@app.post("/api/customers/{customer_id}/wallet")
async def update_customer_wallet_endpoint(customer_id: str, payload: WalletUpdate):
    success = await CustomerRepository.update_wallet(customer_id, payload.amount)
    if success:
        c = await CustomerRepository.get_by_id(customer_id)
        c["_id"] = str(c["_id"])
        return {"success": True, "customer": c}
    raise HTTPException(status_code=404, detail="Customer not found")

@app.post("/api/customers/{customer_id}/addresses")
async def update_customer_addresses_endpoint(customer_id: str, payload: AddressesUpdate):
    success = await CustomerRepository.update(customer_id, {"addresses": payload.addresses, "updated_at": datetime.now()})
    if success:
        c = await CustomerRepository.get_by_id(customer_id)
        c["_id"] = str(c["_id"])
        return {"success": True, "customer": c}
    raise HTTPException(status_code=404, detail="Customer not found")

@app.post("/api/coupons/{coupon_id}/toggle")
async def toggle_coupon_endpoint(coupon_id: str):
    coupon = await CouponRepository.get_by_id(coupon_id)
    if coupon:
        next_status = "Paused" if coupon["status"] == "Active" else "Active"
        await CouponRepository.update(coupon_id, {"status": next_status, "updated_at": datetime.now()})
        coupon = await CouponRepository.get_by_id(coupon_id)
        coupon["_id"] = str(coupon["_id"])
        return {"success": True, "coupon": coupon}
    raise HTTPException(status_code=404, detail="Coupon not found")

@app.post("/api/banners/{banner_id}/status")
async def update_banner_status_endpoint(banner_id: str, payload: StatusUpdate):
    success = await OfferRepository.update(banner_id, {"status": payload.status, "updated_at": datetime.now()})
    if success:
        banner = await OfferRepository.get_by_id(banner_id)
        banner["_id"] = str(banner["_id"])
        return {"success": True, "banner": banner}
    raise HTTPException(status_code=404, detail="Banner not found")

@app.post("/api/audit-logs")
async def add_audit_log_endpoint(payload: dict):
    log = {
        "id": f"log-{int(time.time() * 1000)}",
        "timestamp": datetime.now().isoformat(),
        "is_deleted": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        **payload
    }
    await Database.db.audit_logs.insert_one(log)
    log["_id"] = str(log["_id"])
    return {"success": True, "log": log}

# Create Order Payload and endpoint
class OrderItemPayload(BaseModel):
    productId: str
    name: str
    quantity: int
    price: float
    isVeg: bool

class NewOrderPayload(BaseModel):
    customerId: str
    customerName: str
    customerPhone: str
    outletId: str
    outletName: str
    items: List[OrderItemPayload]
    subtotal: float
    tax: float
    deliveryCharge: float
    packagingCharge: float
    discount: float
    total: float
    paymentMethod: str
    address: str
    orderType: str

@app.post("/api/orders")
async def create_order_endpoint(payload: NewOrderPayload):
    settings_doc = await Database.db.settings.find_one({"is_deleted": False})
    settings = settings_doc if settings_doc else {}

    is_conf_enabled = settings.get("enableWhatsapp", True) or settings.get("enableSms", True)
    now = datetime.now()
    expiry_hours = settings.get("confirmationExpiry", 24)

    order_id = f"order-{str(int(time.time()))[-4:]}"
    
    new_order = {
        "id": order_id,
        "createdAt": now.isoformat(),
        "status": "Pending",
        "timeline": [
            {
                "status": "Pending",
                "timestamp": now.isoformat(),
                "title": "Order Placed",
                "description": "Your order was successfully submitted."
            }
        ],
        "customerId": payload.customerId,
        "customerName": payload.customerName,
        "customerPhone": payload.customerPhone,
        "outletId": payload.outletId,
        "outletName": payload.outletName,
        "items": [it.model_dump() for it in payload.items],
        "subtotal": payload.subtotal,
        "tax": payload.tax,
        "deliveryCharge": payload.deliveryCharge,
        "packagingCharge": payload.packagingCharge,
        "discount": payload.discount,
        "total": payload.total,
        "paymentMethod": payload.paymentMethod,
        "address": payload.address,
        "orderType": payload.orderType,
        "paymentStatus": "Paid" if payload.paymentMethod == "Wallet" else "Pending",
        "confirmation_status": "Pending" if is_conf_enabled else "Confirmed",
        "confirmation_source": None,
        "confirmation_requested_at": now.isoformat() if is_conf_enabled else None,
        "confirmation_token": f"token_{random.randint(100000000, 999999999)}" if is_conf_enabled else None,
        "confirmation_expiry": (now + timedelta(hours=expiry_hours)).isoformat() if is_conf_enabled else None,
        "customer_reply": None,
        "is_deleted": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

    if is_conf_enabled:
        new_order["timeline"].append({
            "status": "Pending Confirmation",
            "timestamp": now.isoformat(),
            "title": "Confirmation Workflow Triggered",
            "description": "System is initiating multi-channel dispatch."
        })

    await OrderRepository.create(new_order)

    # Adjust customer details
    if payload.paymentMethod == "Wallet":
        await CustomerRepository.update_wallet(payload.customerId, -payload.total)
    await CustomerRepository.update(payload.customerId, {"rewardPoints": round(payload.subtotal), "updated_at": datetime.now()})

    new_order["_id"] = str(new_order["_id"])

    if is_conf_enabled:
        asyncio.create_task(NotificationService.queue_notification(order_id, "confirmation"))
    else:
        # Start simulator directly if confirmation is disabled
        DeliveryService.start_simulation(order_id)

    return {"success": True, "order": new_order}

class OrderIdPayload(BaseModel):
    orderId: str

class ResendPayload(BaseModel):
    orderId: str
    channel: str

class SimulateTimeLeapPayload(BaseModel):
    orderId: str
    hours: float

@app.post("/api/orders/send-confirmation")
async def send_confirmation_endpoint(payload: OrderIdPayload):
    order = await OrderRepository.get_by_id(payload.orderId)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    settings_doc = await Database.db.settings.find_one({"is_deleted": False})
    settings = settings_doc if settings_doc else {}
    expiry_hours = settings.get("confirmationExpiry", 24)
    now = datetime.now()

    update_fields = {
        "confirmation_status": "Pending",
        "confirmation_source": None,
        "confirmation_requested_at": now.isoformat(),
        "confirmation_token": f"token_{random.randint(100000000, 999999999)}",
        "confirmation_expiry": (now + timedelta(hours=expiry_hours)).isoformat(),
        "customer_reply": None,
        "updated_at": datetime.now()
    }
    await OrderRepository.update(payload.orderId, update_fields)
    
    timeline_event = {
        "status": "Pending Confirmation",
        "timestamp": now.isoformat(),
        "title": "Confirmation Workflow Triggered",
        "description": "System is initiating multi-channel dispatch."
    }
    await OrderRepository.add_timeline_event(payload.orderId, timeline_event)

    updated_order = await OrderRepository.get_by_id(payload.orderId)
    updated_order["_id"] = str(updated_order["_id"])

    await sio.emit("order_status", { "status": updated_order["status"], "timeline": updated_order["timeline"] }, room=payload.orderId)
    await sio.emit("order_confirmation_updated", updated_order)

    asyncio.create_task(NotificationService.queue_notification(payload.orderId, "confirmation"))
    return {"success": True, "order": updated_order}

# SMS Webhook Simulator
class WebhookPayload(BaseModel):
    From: str
    Body: str

@app.post("/api/webhook/sms")
async def webhook_sms_endpoint(payload: WebhookPayload):
    phone = payload.From
    text = (payload.Body or "").strip()
    logger.info(f"[Webhook SMS] Incoming message from {phone}: \"{text}\"")

    # Match order by normalized customerPhone
    db_orders = await OrderRepository.get_all({"confirmation_status": "Pending"})
    matching_order = None
    for order in db_orders:
        if order.get("customerPhone") in phone or phone in order.get("customerPhone"):
            matching_order = order
            break

    if not matching_order:
        conv_id = f"conv-{int(time.time() * 1000)}"
        in_message = {
            "id": conv_id,
            "order_id": "unknown",
            "customer_number": phone,
            "message": text,
            "direction": "incoming",
            "provider": "sms",
            "timestamp": datetime.now().isoformat(),
            "is_deleted": False,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        await Database.db.conversations.insert_one(in_message)
        await sio.emit("new_chat", in_message)
        return {"success": False, "message": "No active order found."}

    order_id = matching_order["id"]
    conv_id = f"conv-{int(time.time() * 1000)}"
    in_message = {
        "id": conv_id,
        "order_id": order_id,
        "customer_number": matching_order["customerPhone"],
        "message": text,
        "direction": "incoming",
        "provider": "sms",
        "timestamp": datetime.now().isoformat(),
        "is_deleted": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    await Database.db.conversations.insert_one(in_message)
    await sio.emit("new_chat", in_message)

    await OrderRepository.update(order_id, {"customer_reply": text, "updated_at": datetime.now()})

    settings_doc = await Database.db.settings.find_one({"is_deleted": False})
    comm_settings = settings_doc or {}

    clean_text = text.upper()
    if any(k in clean_text for k in ["YES", "CONFIRM", "OK"]):
        await OrderService.confirm_order(order_id, "sms", text, comm_settings)
    elif any(k in clean_text for k in ["NO", "CANCEL", "REJECT"]):
        await OrderService.cancel_order(order_id, "sms", text, comm_settings)
    else:
        timeline_event = {
            "status": "Awaiting Clarification",
            "timestamp": datetime.now().isoformat(),
            "title": "Unrecognized Message Received",
            "description": f"Customer replied: \"{text}\". Expected YES or NO."
        }
        await OrderRepository.add_timeline_event(order_id, timeline_event)

    updated_order = await OrderRepository.get_by_id(order_id)
    updated_order["_id"] = str(updated_order["_id"])
    await sio.emit("order_status", { "status": updated_order["status"], "timeline": updated_order["timeline"] }, room=order_id)
    await sio.emit("order_confirmation_updated", updated_order)
    
    return {"success": True}

@app.post("/api/orders/confirm")
async def force_confirm_endpoint(payload: OrderIdPayload):
    settings_doc = await Database.db.settings.find_one({"is_deleted": False})
    success = await OrderService.confirm_order(payload.orderId, "admin", "Forced Confirm by Administrator", settings_doc or {})
    if success:
        order = await OrderRepository.get_by_id(payload.orderId)
        order["_id"] = str(order["_id"])
        return {"success": True, "order": order}
    raise HTTPException(status_code=400, detail="Failed to force confirm order.")

class CancelPayload(BaseModel):
    orderId: str
    reason: Optional[str] = "Admin Cancelled"

@app.post("/api/orders/cancel")
async def force_cancel_endpoint(payload: CancelPayload):
    settings_doc = await Database.db.settings.find_one({"is_deleted": False})
    success = await OrderService.cancel_order(payload.orderId, "admin", payload.reason, settings_doc or {})
    if success:
        order = await OrderRepository.get_by_id(payload.orderId)
        order["_id"] = str(order["_id"])
        return {"success": True, "order": order}
    raise HTTPException(status_code=400, detail="Failed to force cancel order.")

@app.get("/api/orders/confirmation-history")
async def get_confirmation_history_endpoint():
    orders = await OrderRepository.get_all({"confirmation_requested_at": {"$ne": None}})
    for o in orders:
        o["_id"] = str(o["_id"])
    return orders

@app.get("/api/orders/logs")
async def get_logs_endpoint():
    notifs = await NotificationRepository.get_all()
    for n in notifs:
        n["_id"] = str(n["_id"])
    return notifs

@app.post("/api/orders/resend")
async def resend_confirmation_endpoint(payload: ResendPayload):
    order = await OrderRepository.get_by_id(payload.orderId)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    timeline_event = {
        "status": "Resending",
        "timestamp": datetime.now().isoformat(),
        "title": f"Resend Requested ({payload.channel})",
        "description": "Admin requested manual resending of the confirmation template."
    }
    await OrderRepository.add_timeline_event(payload.orderId, timeline_event)

    updated_order = await OrderRepository.get_by_id(payload.orderId)
    updated_order["_id"] = str(updated_order["_id"])
    await sio.emit("order_confirmation_updated", updated_order)

    asyncio.create_task(NotificationService.queue_notification(payload.orderId, "confirmation"))
    return {"success": True}

@app.get("/api/analytics/order-confirmation")
async def get_order_confirmation_analytics_endpoint():
    db = await load_db_async()
    orders = [o for o in db.get("orders", []) if o.get("confirmation_requested_at") is not None]
    notifs = db.get("notifications", [])
    settings = db.get("communicationSettings", {})

    total = len(orders)
    confirmed = len([o for o in orders if o.get("confirmation_status") == "Confirmed"])
    cancelled = len([o for o in orders if o.get("confirmation_status") == "Cancelled"])
    pending = len([o for o in orders if o.get("confirmation_status") == "Pending"])
    expired = len([o for o in orders if o.get("confirmation_status") == "Expired"])

    wa_provider = settings.get("whatsappProvider", "meta")
    sms_provider = settings.get("smsProvider", "twilio")

    wa_delivered = len([n for n in notifs if n.get("provider") == wa_provider and n.get("status") == "delivered"])
    wa_failed = len([n for n in notifs if n.get("provider") == wa_provider and n.get("status") == "failed"])
    sms_delivered = len([n for n in notifs if n.get("provider") == sms_provider and n.get("status") == "delivered"])
    sms_failed = len([n for n in notifs if n.get("provider") == sms_provider and n.get("status") == "failed"])
    awaiting_reply = pending

    # Average confirmation time
    total_minutes = 0.0
    count_confirmed = 0
    for o in orders:
        if o.get("confirmation_status") == "Confirmed" and o.get("confirmation_requested_at") and o.get("confirmed_at"):
            try:
                req_t = datetime.fromisoformat(o["confirmation_requested_at"])
                conf_t = datetime.fromisoformat(o["confirmed_at"])
                diff = (conf_t - req_t).total_seconds() / 60.0
                total_minutes += diff
                count_confirmed += 1
            except ValueError:
                pass

    avg_confirm_time = float(f"{(total_minutes / count_confirmed):.2f}") if count_confirmed > 0 else 0.0
    confirmation_rate = float(f"{((confirmed / total) * 100.0):.1f}") if total > 0 else 0.0

    wa_total = wa_delivered + wa_failed
    wa_success_rate = float(f"{((wa_delivered / wa_total) * 100.0):.1f}") if wa_total > 0 else 100.0

    sms_total = sms_delivered + sms_failed
    sms_success_rate = float(f"{((sms_delivered / sms_total) * 100.0):.1f}") if sms_total > 0 else 100.0

    cancellation_reasons = [
        { "reason": "Customer Cancelled", "count": cancelled },
        { "reason": "Confirmation Expired", "count": expired },
        { "reason": "Changed Mind", "count": int(cancelled * 0.1) },
        { "reason": "Wrong Address", "count": int(cancelled * 0.05) }
    ]

    return {
        "cards": {
            "total": total,
            "pending": pending,
            "confirmed": confirmed,
            "cancelled": cancelled,
            "waDelivered": wa_delivered,
            "smsDelivered": sms_delivered,
            "waFailed": wa_failed,
            "smsFailed": sms_failed,
            "awaitingReply": awaiting_reply,
            "avgConfirmTime": avg_confirm_time,
            "confirmationRate": confirmation_rate
        },
        "analytics": {
            "waSuccessRate": wa_success_rate,
            "smsSuccessRate": sms_success_rate,
            "cancellationReasons": cancellation_reasons
        }
    }

@app.post("/api/orders/simulate-time-leap")
async def simulate_time_leap_endpoint(payload: SimulateTimeLeapPayload):
    order = await OrderRepository.get_by_id(payload.orderId)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    req_at_str = order.get("confirmation_requested_at")
    requested_at = datetime.fromisoformat(req_at_str) if req_at_str else datetime.now()

    offset = timedelta(hours=payload.hours)
    shifted_req_at = (requested_at - offset).isoformat()
    
    # Update order times
    await OrderRepository.update(payload.orderId, {
        "confirmation_requested_at": shifted_req_at,
        "updated_at": datetime.now()
    })

    # Shift timeline timestamps
    timeline = order.get("timeline", [])
    for step in timeline:
        if step["status"] == "Pending Confirmation" or "Sent" in step["status"]:
            try:
                t_val = datetime.fromisoformat(step["timestamp"])
                step["timestamp"] = (t_val - offset).isoformat()
            except ValueError:
                pass
    
    await OrderRepository.update(payload.orderId, {"timeline": timeline})

    # Force scheduler check
    await NotificationService.run_schedule_check()

    updated_order = await OrderRepository.get_by_id(payload.orderId)
    updated_order["_id"] = str(updated_order["_id"])

    await sio.emit("order_status", { "status": updated_order["status"], "timeline": updated_order["timeline"] }, room=payload.orderId)
    await sio.emit("order_confirmation_updated", updated_order)

    return {"success": True, "order": updated_order}

@app.get("/api/orders/conversations/{order_id}")
async def get_conversations_endpoint(order_id: str):
    cursor = Database.db.conversations.find({"order_id": order_id, "is_deleted": False}).sort("timestamp", 1)
    convs = await cursor.to_list(length=100)
    for c in convs:
        c["_id"] = str(c["_id"])
    return convs

@app.get("/api/orders/settings")
async def get_settings_endpoint():
    settings_doc = await Database.db.settings.find_one({"is_deleted": False})
    if settings_doc:
        settings_doc["_id"] = str(settings_doc["_id"])
        return settings_doc
    return INITIAL_DB["communicationSettings"]

@app.post("/api/orders/settings")
async def save_settings_endpoint(request: Request):
    new_settings = await request.json()
    new_settings["is_deleted"] = False
    new_settings["updated_at"] = datetime.now()

    # Strip ObjectId if provided from frontend
    if "_id" in new_settings:
        del new_settings["_id"]

    await Database.db.settings.update_one(
        {"is_deleted": False},
        {"$set": new_settings},
        upsert=True
    )
    
    await sio.emit("communication_settings_updated", new_settings)
    return {"success": True, "settings": new_settings}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:socket_app", host="127.0.0.1", port=8000, reload=True)
