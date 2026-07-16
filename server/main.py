from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
import sys
import random
import time
import asyncio
from datetime import datetime, timedelta
import socketio

# Ensure the server directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI()

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

DB_FILE = os.path.join(os.path.dirname(__file__), "db.json")

# Initial mock data fallback
INITIAL_DB = {
  "outlets": [
    { "id": "out-1", "name": "Downtown Central Outlet", "address": "124 Market St, Downtown", "manager": "Sarah Jenkins", "phone": "+1 555-0192", "status": "Open", "revenue": 15480, "ordersCount": 420, "taxNumber": "GST-33AABCC1234D", "hours": "08:00 AM - 11:00 PM", "latitude": 40.7128, "longitude": -74.0060 },
    { "id": "out-2", "name": "West End Cafe", "address": "482 Broadway Rd, West End", "manager": "David Miller", "phone": "+1 555-0144", "status": "Open", "revenue": 9820, "ordersCount": 260, "taxNumber": "GST-33AABCC5678E", "hours": "09:00 AM - 10:00 PM", "latitude": 40.7198, "longitude": -74.0200 },
    { "id": "out-3", "name": "Metro Plaza Food Court", "address": "Suite 12, Metro Mall, Plaza St", "manager": "Elena Rostova", "phone": "+1 555-0188", "status": "Open", "revenue": 21300, "ordersCount": 650, "taxNumber": "GST-33AABCC9012F", "hours": "10:00 AM - 11:30 PM", "latitude": 40.7090, "longitude": -74.0010 },
    { "id": "out-4", "name": "North Suburbs Delivery Kitchen", "address": "Industrial Area Phase 2", "manager": "Rajesh Sharma", "phone": "+1 555-0165", "status": "Open", "revenue": 6400, "ordersCount": 180, "taxNumber": "GST-33AABCC4321G", "hours": "11:00 AM - 02:00 AM", "latitude": 40.7250, "longitude": -74.0200 }
  ],
  "products": [
    { "id": "prod-1", "name": "Truffle Mushroom Burger", "category": "Fast Food", "subcategory": "Burgers", "price": 12.99, "discount": 10, "availability": True, "preparationTime": 12, "isVeg": True, "isBestSeller": True, "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400", "outletIds": ["out-1", "out-2", "out-3"], "gstRate": 5, "description": "Freshly grilled portobello mushroom with melted cheese, truffle paste, and signature brioche bun." },
    { "id": "prod-2", "name": "Spicy Pepperoni Pizza (12\")", "category": "Italian", "subcategory": "Pizza", "price": 16.99, "discount": 0, "availability": True, "preparationTime": 18, "isVeg": False, "isBestSeller": True, "image": "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400", "outletIds": ["out-1", "out-3", "out-4"], "gstRate": 12, "description": "Crisp sourdough crust topped with spicy premium pepperoni slice, hand-stretched mozzarella, and tangy marinara." },
    { "id": "prod-3", "name": "Avocado Toast with Poached Egg", "category": "Breakfast", "subcategory": "Toast", "price": 9.50, "discount": 5, "availability": True, "preparationTime": 8, "isVeg": True, "isBestSeller": False, "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400", "outletIds": ["out-1", "out-2"], "gstRate": 5, "description": "Smashed Haas avocados, flaky sea salt, organic eggs, sourdough bread toasted with organic butter." },
    { "id": "prod-4", "name": "Iced Vanilla Matcha Latte", "category": "Beverages", "subcategory": "Teas", "price": 5.99, "discount": 0, "availability": True, "preparationTime": 4, "isVeg": True, "isBestSeller": True, "image": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400", "outletIds": ["out-1", "out-2", "out-3", "out-4"], "gstRate": 5, "description": "Ceremonial grade Japanese Uji matcha whisked with organic oat milk and natural vanilla pod syrup." },
    { "id": "prod-5", "name": "Crispy Buffalo Chicken Wings (8pcs)", "category": "Snacks", "subcategory": "Appetizers", "price": 11.99, "discount": 15, "availability": True, "preparationTime": 15, "isVeg": False, "isBestSeller": False, "image": "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400", "outletIds": ["out-1", "out-3", "out-4"], "gstRate": 18, "description": "Spicy tossed bone-in chicken wings, glazed with signature hot sauce, served with blue cheese dip." },
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
      "createdAt": datetime.now().isoformat(),
      "preparationTimeRemaining": 8,
      "address": "Apt 4B, 32 Wall Street, Financial District, NY",
      "orderType": "Delivery",
      "timeline": [
        { "status": "Pending", "timestamp": datetime.now().isoformat(), "title": "Order Placed", "description": "Order successfully placed by customer." },
        { "status": "Pending", "timestamp": datetime.now().isoformat(), "title": "Order Confirmed", "description": "Payment verified and order sent to Kitchen." },
        { "status": "Preparing", "timestamp": datetime.now().isoformat(), "title": "Kitchen Accepted", "description": "Chef Sarah started preparing the items." }
      ],
      "confirmation_status": "Confirmed",
      "confirmed_at": datetime.now().isoformat(),
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
      "createdAt": datetime.now().isoformat(),
      "deliveryPartnerId": "rider-2",
      "address": "Floor 14, 52 Hudson Yards, Midtown West, NY",
      "orderType": "Delivery",
      "timeline": [
        { "status": "Pending", "timestamp": datetime.now().isoformat(), "title": "Order Placed", "description": "Order placed by customer." },
        { "status": "Pending", "timestamp": datetime.now().isoformat(), "title": "Order Confirmed", "description": "Auto-accepted and routed to kitchen." },
        { "status": "Preparing", "timestamp": datetime.now().isoformat(), "title": "Preparing", "description": "Oven heating, ingredients added." },
        { "status": "Ready", "timestamp": datetime.now().isoformat(), "title": "Packed & Ready", "description": "Food packed in insulation container." },
        { "status": "Out for Delivery", "timestamp": datetime.now().isoformat(), "title": "Handed Over to Rider", "description": "Rider Alex Mercer is transit with order." }
      ],
      "confirmation_status": "Confirmed",
      "confirmed_at": datetime.now().isoformat(),
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
    { "id": "ban-1", "title": "Monsoon Special Combo 25% Off", "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600", "status": "Active", "type": "Homepage", "schedule": "2026-07-01 to 2026-07-31" },
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

def load_db() -> dict:
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w") as f:
            json.dump(INITIAL_DB, f, indent=2)
        return INITIAL_DB
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return INITIAL_DB

def save_db(data: dict):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)

# Socket.IO Event Handlers
@sio.event
async def connect(sid, environ):
    print(f"[Socket] Connected: {sid}")

@sio.event
async def join_order(sid, orderId):
    await sio.enter_room(sid, orderId)
    print(f"[Socket] Client {sid} joined tracking room: {orderId}")
    db = load_db()
    order = next((o for o in db.get("orders", []) if o["id"] == orderId), None)
    if order:
        await sio.emit("order_status", {"status": order["status"], "timeline": order["timeline"]}, room=sid)

@sio.event
async def disconnect(sid):
    print(f"[Socket] Disconnected: {sid}")

# Simulation maps
active_simulations = {}

async def run_order_simulation(order_id: str):
    print(f"[Simulation] Starting workflow for order: {order_id}")
    statuses = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Picked Up', 'Out for Delivery', 'Delivered']
    current_status_index = 0

    route_points = []
    start_lat = 40.7128
    start_lng = -74.0060
    end_lat = 40.7306
    end_lng = -73.9352
    steps = 12

    for i in range(steps + 1):
        fraction = i / steps
        route_points.append({
            "latitude": start_lat + (end_lat - start_lat) * fraction,
            "longitude": start_lng + (end_lng - start_lng) * fraction
        })
    route_index = 0

    while True:
        await asyncio.sleep(4)
        db = load_db()
        order = next((o for o in db.get("orders", []) if o["id"] == order_id), None)
        
        if not order:
            print(f"[Simulation] Order {order_id} not found, simulation aborted.")
            break

        if order["status"] != statuses[current_status_index]:
            next_status = statuses[current_status_index]
            order["status"] = next_status
            order["timeline"].append({
                "status": next_status,
                "timestamp": datetime.now().isoformat(),
                "title": f"Order is {next_status}",
                "description": get_status_description(next_status)
            })

            if next_status == 'Delivered':
                order["paymentStatus"] = 'Paid'
                save_db(db)
                await sio.emit('order_status', { "status": 'Delivered', "timeline": order["timeline"] }, room=order_id)
                print(f"[Simulation] Order {order_id} delivered, simulation stopped.")
                break

            save_db(db)
            await sio.emit('order_status', { "status": next_status, "timeline": order["timeline"] }, room=order_id)
            print(f"[Simulation] Order {order_id} transitioned to: {next_status}")

        if order["status"] == 'Out for Delivery':
            if route_index < len(route_points):
                point = route_points[route_index]
                eta = max(1, round((len(route_points) - route_index) * 1.5))
                distance = float(f"{((len(route_points) - route_index) * 0.35):.2f}")

                await sio.emit('rider_location', {
                    "latitude": point["latitude"],
                    "longitude": point["longitude"],
                    "etaMinutes": eta,
                    "distanceKm": distance,
                    "riderName": "Alex Mercer",
                    "riderPhone": "+1 555-0233",
                    "riderAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
                }, room=order_id)
                route_index += 1
            else:
                current_status_index += 1
        else:
            current_status_index += 1

def start_order_simulation(order_id: str):
    if order_id in active_simulations:
        return
    task = asyncio.create_task(run_order_simulation(order_id))
    active_simulations[order_id] = task

def get_status_description(status: str) -> str:
    descriptions = {
        'Pending': 'Awaiting restaurant approval.',
        'Accepted': 'Restaurant accepted your order.',
        'Preparing': 'Our chef is preparing your meal.',
        'Ready': 'Order packed and ready for delivery partner pickup.',
        'Picked Up': 'Delivery partner picked up your package.',
        'Out for Delivery': 'Rider is on the way to your address.',
        'Delivered': 'Your order has been delivered. Enjoy your meal!'
    }
    return descriptions.get(status, 'Processing your order.')

# Template Compilation
def compile_template(template: str, vars: dict) -> str:
    compiled = template
    mapping = {
        "CustomerName": vars.get("customerName", "Customer"),
        "OrderID": vars.get("orderId", ""),
        "Items": vars.get("items", ""),
        "Amount": vars.get("amount", "0.00"),
        "Address": vars.get("address", ""),
        "CompanyName": vars.get("companyName", "Delivo Cafe"),
        "SupportNumber": vars.get("supportNumber", "+1 555-0100")
    }
    for key, val in mapping.items():
        compiled = compiled.replace(f"{{{{{key}}}}}", str(val))
        compiled = compiled.replace(f"{{{{ {key} }}}}", str(val))
    return compiled

# Messaging Engine Simulator
async def send_provider_message(channel: str, provider: str, customer_phone: str, attempt: int) -> dict:
    print(f"[Notification Engine] Dispatching via {channel.upper()} ({provider}) to {customer_phone} (Retry: {attempt})")
    is_failure = False
    reason = "Simulated delivery success"

    if channel == "whatsapp":
        if customer_phone.endswith("9") or customer_phone.endswith("8"):
            is_failure = True
            reason = "Provider error code 500: Gateway Timeout"
    elif channel == "sms":
        if customer_phone.endswith("8"):
            is_failure = True
            reason = "Carrier error code 30008: Destination unreachable"

    await asyncio.sleep(0.8)
    timestamp = datetime.now().isoformat()

    if is_failure:
        print(f"[Notification Engine] ❌ Message delivery failed on {channel}: {reason}")
        return {
            "success": False,
            "status": "failed",
            "sent_at": timestamp,
            "provider_response": reason
        }
    print(f"[Notification Engine] ✅ Message delivered on {channel} successfully.")
    return {
        "success": True,
        "status": "delivered",
        "sent_at": timestamp,
        "delivered_at": timestamp,
        "provider_response": "OK: Message Queued & Delivered"
    }

async def queue_notification(order_id: str, type: str, custom_data: dict = None):
    if custom_data is None:
        custom_data = {}
    db = load_db()
    order = next((o for o in db.get("orders", []) if o["id"] == order_id), None)
    if not order:
        print(f"[Notification Queue] Order not found: {order_id}")
        return

    settings = db.get("communicationSettings", {})
    customer_phone = order["customerPhone"]
    customer_name = order["customerName"]

    items_string = ", ".join([f"{it['quantity']}x {it['name']}" for it in order["items"]])
    template_vars = {
        "customerName": customer_name,
        "orderId": order["id"].split("-")[1] if "-" in order["id"] else order["id"],
        "items": items_string,
        "amount": f"{order['total']:.2f}",
        "address": order["address"],
        **custom_data
    }

    templates = settings.get("templates", {})
    template_text = templates.get(type, "")
    message_text = compile_template(template_text, template_vars)

    db.setdefault("notifications", [])
    db.setdefault("conversations", [])

    current_channel = "whatsapp" if settings.get("enableWhatsapp", True) else "sms"
    provider = settings.get("whatsappProvider", "meta") if current_channel == "whatsapp" else settings.get("smsProvider", "twilio")
    status = "failed"
    response_data = None
    attempt = 0
    max_retries = settings.get("retryCount", 3)

    if current_channel == "whatsapp":
        while attempt <= max_retries:
            notif_id = f"notif-{int(time.time() * 1000)}-{random.randint(0, 999)}"
            new_notif = {
                "id": notif_id,
                "order_id": order_id,
                "provider": provider,
                "type": type,
                "status": "sent",
                "message": message_text,
                "sent_at": datetime.now().isoformat(),
                "delivered_at": None,
                "read_at": None,
                "reply_at": None,
                "retry_count": attempt,
                "provider_response": "Sending...",
                "created_at": datetime.now().isoformat()
            }
            db["notifications"].append(new_notif)
            save_db(db)
            await sio.emit("new_notification", new_notif)

            response_data = await send_provider_message("whatsapp", provider, customer_phone, attempt)

            # Update DB notification
            db = load_db()
            for n in db.get("notifications", []):
                if n["id"] == notif_id:
                    n["status"] = response_data["status"]
                    n["delivered_at"] = response_data.get("delivered_at")
                    n["provider_response"] = response_data["provider_response"]
                    if response_data["success"]:
                        n["read_at"] = (datetime.now() + timedelta(seconds=1.5)).isoformat()
                    break
            save_db(db)
            
            # Emit updated notification
            updated_notif = next((n for n in db.get("notifications", []) if n["id"] == notif_id), new_notif)
            await sio.emit("new_notification", updated_notif)

            # Log conversation
            conv_id = f"conv-{int(time.time() * 1000)}-{random.randint(0, 999)}"
            out_message = {
                "id": conv_id,
                "order_id": order_id,
                "customer_number": customer_phone,
                "message": message_text,
                "direction": "outgoing",
                "provider": "whatsapp",
                "timestamp": datetime.now().isoformat()
            }
            db["conversations"].append(out_message)
            save_db(db)
            await sio.emit("new_chat", out_message)

            # Timeline update
            db = load_db()
            for o in db.get("orders", []):
                if o["id"] == order_id:
                    o["timeline"].append({
                        "status": "WhatsApp Sent",
                        "timestamp": datetime.now().isoformat(),
                        "title": f"WhatsApp Confirmation {'Retry ' + str(attempt) if attempt > 0 else 'Sent'}",
                        "description": "Message delivered successfully to customer's WhatsApp." if response_data["success"] else f"Delivery failed: {response_data['provider_response']}"
                    })
                    await sio.emit("order_status", { "status": o["status"], "timeline": o["timeline"] }, room=order_id)
                    await sio.emit("order_confirmation_updated", o)
                    break
            save_db(db)

            if response_data["success"]:
                status = "delivered"
                break
            attempt += 1

        if status == "failed" and settings.get("enableSms", True):
            print("[Notification Engine] ⚠️ WhatsApp failed. Cascading fallback to SMS...")
            current_channel = "sms"
            provider = settings.get("smsProvider", "twilio")
            attempt = 0

    if current_channel == "sms":
        while attempt <= max_retries:
            notif_id = f"notif-{int(time.time() * 1000)}-{random.randint(0, 999)}"
            sms_text = f"Your Order #{order_id.split('-')[1] if '-' in order_id else order_id} is waiting for confirmation. Reply YES to Confirm, Reply NO to Cancel."
            new_notif = {
                "id": notif_id,
                "order_id": order_id,
                "provider": provider,
                "type": type,
                "status": "sent",
                "message": sms_text,
                "sent_at": datetime.now().isoformat(),
                "delivered_at": None,
                "read_at": None,
                "reply_at": None,
                "retry_count": attempt,
                "provider_response": "Sending...",
                "created_at": datetime.now().isoformat()
            }
            db = load_db()
            db.setdefault("notifications", []).append(new_notif)
            save_db(db)
            await sio.emit("new_notification", new_notif)

            response_data = await send_provider_message("sms", provider, customer_phone, attempt)

            db = load_db()
            for n in db.get("notifications", []):
                if n["id"] == notif_id:
                    n["status"] = response_data["status"]
                    n["delivered_at"] = response_data.get("delivered_at")
                    n["provider_response"] = response_data["provider_response"]
                    break
            save_db(db)
            
            updated_notif = next((n for n in db.get("notifications", []) if n["id"] == notif_id), new_notif)
            await sio.emit("new_notification", updated_notif)

            # Log conversation
            conv_id = f"conv-{int(time.time() * 1000)}-{random.randint(0, 999)}"
            out_message = {
                "id": conv_id,
                "order_id": order_id,
                "customer_number": customer_phone,
                "message": sms_text,
                "direction": "outgoing",
                "provider": "sms",
                "timestamp": datetime.now().isoformat()
            }
            db["conversations"].append(out_message)
            save_db(db)
            await sio.emit("new_chat", out_message)

            # Timeline
            db = load_db()
            for o in db.get("orders", []):
                if o["id"] == order_id:
                    o["timeline"].append({
                        "status": "SMS Sent",
                        "timestamp": datetime.now().isoformat(),
                        "title": f"SMS Confirmation {'Retry ' + str(attempt) if attempt > 0 else 'Sent'}",
                        "description": "SMS delivered successfully to customer's mobile number." if response_data["success"] else f"SMS Delivery failed: {response_data['provider_response']}"
                    })
                    await sio.emit("order_status", { "status": o["status"], "timeline": o["timeline"] }, room=order_id)
                    await sio.emit("order_confirmation_updated", o)
                    break
            save_db(db)

            if response_data["success"]:
                status = "delivered"
                break
            attempt += 1

    if status == "failed":
        print(f"[Notification Engine] 🚨 Critical: WhatsApp and SMS both failed for Order #{order_id}")
        alert_notif = {
            "id": f"alert-{int(time.time() * 1000)}",
            "title": "Confirmation Delivery Failure",
            "description": f"Unable to reach {customer_name} ({customer_phone}) for Order #{order_id.split('-')[1] if '-' in order_id else order_id}. All channels failed.",
            "type": "system",
            "timestamp": datetime.now().isoformat(),
            "read": False
        }
        db = load_db()
        db.setdefault("notifications", []).append(alert_notif)
        
        for o in db.get("orders", []):
            if o["id"] == order_id:
                o["timeline"].append({
                    "status": "Delivery Failed",
                    "timestamp": datetime.now().isoformat(),
                    "title": "Communication Channels Blocked",
                    "description": "Both WhatsApp and SMS carriers rejected delivery attempts. Admin intervention required."
                })
                await sio.emit("order_status", { "status": o["status"], "timeline": o["timeline"] }, room=order_id)
                await sio.emit("order_confirmation_updated", o)
                break
        save_db(db)
        await sio.emit("new_notification", alert_notif)

# Background Scheduler Check
async def run_schedule_check():
    db = load_db()
    orders = db.get("orders", [])
    if not orders:
        return

    now = datetime.now()
    updated = False

    for order in orders:
        if order.get("confirmation_status") != "Pending":
            continue

        req_at_str = order.get("confirmation_requested_at")
        if not req_at_str:
            continue

        try:
            requested_at = datetime.fromisoformat(req_at_str)
        except ValueError:
            continue

        elapsed_hours = (now - requested_at).total_seconds() / 3600.0

        # Count reminders
        reminder_count = len([
            n for n in db.get("notifications", [])
            if n.get("order_id") == order["id"] and n.get("type") == "reminder" and n.get("status") != "failed"
        ])

        # Check Expiry
        settings = db.get("communicationSettings", {})
        expiry_hours = settings.get("confirmationExpiry", 24)
        if elapsed_hours >= expiry_hours:
            print(f"[Scheduler] Order {order['id']} expired after {elapsed_hours:.2f} hours")
            order["confirmation_status"] = "Expired"
            order["status"] = "Cancelled"
            order["cancelled_at"] = now.isoformat()
            order["timeline"].append({
                "status": "Confirmation Expired",
                "timestamp": now.isoformat(),
                "title": "Confirmation Expired",
                "description": f"Customer failed to confirm order within {expiry_hours} hours."
            })

            alert_notif = {
                "id": f"alert-{int(time.time() * 1000)}",
                "title": "Order Confirmation Expired",
                "description": f"Order #{order['id'].split('-')[1]} confirmation expired after {expiry_hours} hours. Status changed to Cancelled.",
                "type": "system",
                "timestamp": now.isoformat(),
                "read": False
            }
            db.setdefault("notifications", []).append(alert_notif)
            updated = True

            await sio.emit("new_notification", alert_notif)
            await sio.emit("order_status", { "status": order["status"], "timeline": order["timeline"] }, room=order["id"])
            await sio.emit("order_confirmation_updated", order)
            continue

        # Check Reminder 2
        if elapsed_hours >= 6 and reminder_count < 2:
            print(f"[Scheduler] Dispatching Reminder 2 for Order {order['id']}")
            updated = True
            asyncio.create_task(queue_notification(order["id"], "reminder", {"messageLabel": "Second Reminder"}))

        # Check Reminder 1
        elif elapsed_hours >= 2 and reminder_count < 1:
            print(f"[Scheduler] Dispatching Reminder 1 for Order {order['id']}")
            updated = True
            asyncio.create_task(queue_notification(order["id"], "reminder", {"messageLabel": "First Reminder"}))

    if updated:
        save_db(db)

async def scheduler_loop():
    print("[Scheduler] Background Order Confirmation Monitor initialized.")
    while True:
        try:
            await run_schedule_check()
        except Exception as e:
            print(f"[Scheduler] Loop error: {e}")
        await asyncio.sleep(10)

@app.on_event("startup")
async def startup_event():
    load_db()
    asyncio.create_task(scheduler_loop())

# REST API Endpoints
@app.get("/api/db")
def get_db():
    return load_db()

@app.get("/api/products")
def get_products():
    db = load_db()
    return db.get("products", [])

@app.get("/api/banners")
def get_banners():
    db = load_db()
    return db.get("banners", [])

@app.get("/api/coupons")
def get_coupons():
    db = load_db()
    return [c for c in db.get("coupons", []) if c.get("status") == "Active"]

@app.get("/api/categories")
def get_categories():
    db = load_db()
    products = db.get("products", [])
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

# Auth Models & Routes
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
def login(payload: LoginPayload):
    db = load_db()
    customer = None
    for c in db.get("customers", []):
        if (payload.email and c.get("email") == payload.email) or (payload.phone and c.get("phone") == payload.phone):
            customer = c
            break

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
            "favoriteItems": []
        }
        db.setdefault("customers", []).append(customer)
        save_db(db)

    return {
        "success": True,
        "token": "jwt-mock-token-xyz-12345",
        "user": customer
    }

@app.post("/api/auth/register")
def register(payload: RegisterPayload):
    db = load_db()
    for c in db.get("customers", []):
        if c.get("email") == payload.email or c.get("phone") == payload.phone:
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
        "favoriteItems": []
    }
    db.setdefault("customers", []).append(customer)
    save_db(db)

    return {
        "success": True,
        "token": "jwt-mock-token-xyz-12345",
        "user": customer
    }

@app.post("/api/auth/verify-otp")
def verify_otp(payload: OtpPayload):
    if not payload.code or len(payload.code) != 6:
        raise HTTPException(status_code=400, detail="Invalid OTP format. Must be 6 digits.")

    db = load_db()
    customer = None
    for c in db.get("customers", []):
        if c.get("phone") == payload.phone:
            customer = c
            break

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
            "favoriteItems": []
        }
        db.setdefault("customers", []).append(customer)
        save_db(db)

    return {
        "success": True,
        "token": "jwt-mock-token-xyz-12345",
        "user": customer
    }

@app.get("/api/auth/profile")
def get_profile():
    db = load_db()
    customers = db.get("customers", [])
    if customers:
        return customers[0]
    return {}

# Order Management endpoints
class OrderStatusUpdate(BaseModel):
    status: str
    updatedBy: str

class RiderAssign(BaseModel):
    riderId: str
    updatedBy: str

@app.post("/api/orders/{order_id}/status")
async def update_order_status(order_id: str, payload: OrderStatusUpdate):
    db = load_db()
    order = next((o for o in db.get("orders", []) if o["id"] == order_id), None)
    if order:
        order["status"] = payload.status
        order["timeline"].append({
            "status": payload.status,
            "timestamp": datetime.now().isoformat(),
            "title": f"Status Updated to {payload.status}",
            "description": f"Order status set by {payload.updatedBy}."
        })
        if payload.status == "Delivered":
            order["paymentStatus"] = "Paid"
        elif payload.status == "Cancelled":
            order["paymentStatus"] = "Refunded"

        save_db(db)
        await sio.emit("order_status", { "status": payload.status, "timeline": order["timeline"] }, room=order_id)
        return {"success": True, "order": order}
    raise HTTPException(status_code=404, detail="Order not found")

@app.post("/api/orders/{order_id}/assign-rider")
async def assign_rider(order_id: str, payload: RiderAssign):
    db = load_db()
    order = next((o for o in db.get("orders", []) if o["id"] == order_id), None)
    rider = next((r for r in db.get("deliveryPartners", []) if r["id"] == payload.riderId), None)

    if order and rider:
        order["deliveryPartnerId"] = payload.riderId
        order["status"] = "Out for Delivery"
        order["timeline"].append({
            "status": "Out for Delivery",
            "timestamp": datetime.now().isoformat(),
            "title": "Dispatched with Rider",
            "description": f"Assigned to rider {rider['name']} by {payload.updatedBy}."
        })
        rider["status"] = "On Delivery"
        rider["assignedOrderId"] = order_id
        save_db(db)

        await sio.emit("order_status", { "status": "Out for Delivery", "timeline": order["timeline"] }, room=order_id)
        return {"success": True, "order": order, "rider": rider}
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
        db = load_db()
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

# Customer Management
class StatusUpdate(BaseModel):
    status: str

class WalletUpdate(BaseModel):
    amount: float

class AddressesUpdate(BaseModel):
    addresses: List[str]

@app.post("/api/customers/{customer_id}/status")
def update_customer_status(customer_id: str, payload: StatusUpdate):
    db = load_db()
    for c in db.get("customers", []):
        if c["id"] == customer_id:
            c["status"] = payload.status
            save_db(db)
            return {"success": True, "customer": c}
    raise HTTPException(status_code=404, detail="Customer not found")

@app.post("/api/customers/{customer_id}/wallet")
def update_customer_wallet(customer_id: str, payload: WalletUpdate):
    db = load_db()
    for c in db.get("customers", []):
        if c["id"] == customer_id:
            c["walletBalance"] += payload.amount
            save_db(db)
            return {"success": True, "customer": c}
    raise HTTPException(status_code=404, detail="Customer not found")

@app.post("/api/customers/{customer_id}/addresses")
def update_customer_addresses(customer_id: str, payload: AddressesUpdate):
    db = load_db()
    for c in db.get("customers", []):
        if c["id"] == customer_id:
            c["addresses"] = payload.addresses
            save_db(db)
            return {"success": True, "customer": c}
    raise HTTPException(status_code=404, detail="Customer not found")

@app.post("/api/coupons/{coupon_id}/toggle")
def toggle_coupon(coupon_id: str):
    db = load_db()
    for c in db.get("coupons", []):
        if c["id"] == coupon_id:
            c["status"] = "Paused" if c["status"] == "Active" else "Active"
            save_db(db)
            return {"success": True, "coupon": c}
    raise HTTPException(status_code=404, detail="Coupon not found")

@app.post("/api/banners/{banner_id}/status")
def update_banner_status(banner_id: str, payload: StatusUpdate):
    db = load_db()
    for b in db.get("banners", []):
        if b["id"] == banner_id:
            b["status"] = payload.status
            save_db(db)
            return {"success": True, "banner": b}
    raise HTTPException(status_code=404, detail="Banner not found")

@app.post("/api/audit-logs")
def add_audit_log(payload: dict):
    db = load_db()
    log = {
        "id": f"log-{int(time.time() * 1000)}",
        "timestamp": datetime.now().isoformat(),
        **payload
    }
    db.setdefault("auditLogs", []).insert(0, log)
    save_db(db)
    return {"success": True, "log": log}

# Create Order
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
async def create_order(payload: NewOrderPayload):
    db = load_db()
    settings = db.get("communicationSettings", {})
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
        **payload.model_dump(),
        "confirmation_status": "Pending" if is_conf_enabled else None,
        "confirmation_source": None,
        "confirmation_requested_at": now.isoformat() if is_conf_enabled else None,
        "confirmation_token": f"token_{random.randint(100000000, 999999999)}" if is_conf_enabled else None,
        "confirmation_expiry": (now + timedelta(hours=expiry_hours)).isoformat() if is_conf_enabled else None,
        "customer_reply": None
    }

    if is_conf_enabled:
        new_order["timeline"].append({
            "status": "Pending Confirmation",
            "timestamp": now.isoformat(),
            "title": "Confirmation Workflow Triggered",
            "description": "System is initiating multi-channel dispatch."
        })

    db.setdefault("orders", []).insert(0, new_order)

    # Adjust customer details
    for c in db.get("customers", []):
        if c["id"] == payload.customerId:
            if payload.paymentMethod == "Wallet":
                c["walletBalance"] = max(0.0, c["walletBalance"] - payload.total)
            c["rewardPoints"] += round(payload.subtotal)
            break

    save_db(db)

    if is_conf_enabled:
        asyncio.create_task(queue_notification(order_id, "confirmation"))
    else:
        start_order_simulation(order_id)

    return {"success": True, "order": new_order}

# Order Confirmation Center Routes
class OrderIdPayload(BaseModel):
    orderId: str

class ResendPayload(BaseModel):
    orderId: str
    channel: str

class SimulateTimeLeapPayload(BaseModel):
    orderId: str
    hours: float

@app.post("/api/orders/send-confirmation")
async def send_confirmation(payload: OrderIdPayload):
    db = load_db()
    order = next((o for o in db.get("orders", []) if o["id"] == payload.orderId), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    settings = db.get("communicationSettings", {})
    expiry_hours = settings.get("confirmationExpiry", 24)
    now = datetime.now()

    order["confirmation_status"] = "Pending"
    order["confirmation_source"] = None
    order["confirmation_requested_at"] = now.isoformat()
    order["confirmation_token"] = f"token_{random.randint(100000000, 999999999)}"
    order["confirmation_expiry"] = (now + timedelta(hours=expiry_hours)).isoformat()
    order["customer_reply"] = None

    order["timeline"].append({
        "status": "Pending Confirmation",
        "timestamp": now.isoformat(),
        "title": "Confirmation Workflow Triggered",
        "description": "System is initiating multi-channel dispatch."
    })
    save_db(db)

    await sio.emit("order_status", { "status": order["status"], "timeline": order["timeline"] }, room=payload.orderId)
    await sio.emit("order_confirmation_updated", order)

    asyncio.create_task(queue_notification(payload.orderId, "confirmation"))
    return {"success": True, "order": order}

def normalize_phone(phone: str) -> str:
    if not phone:
        return ""
    digits = "".join([c for c in phone if c.isdigit()])
    return digits[-10:]

# Webhooks Simulation
class WebhookPayload(BaseModel):
    From: str
    Body: str

@app.post("/api/webhook/whatsapp")
async def webhook_whatsapp(payload: WebhookPayload):
    phone = normalize_phone(payload.From)
    text = (payload.Body or "").strip()
    print(f"[Webhook WhatsApp] Incoming from normalize({payload.From}) -> {phone}: \"{text}\"")

    db = load_db()
    order = next((o for o in db.get("orders", []) if o.get("confirmation_status") == "Pending" and normalize_phone(o.get("customerPhone")) == phone), None)

    if not order:
        print(f"[Webhook WhatsApp] No pending order found for phone {phone}")
        conv_id = f"conv-{int(time.time() * 1000)}"
        in_message = {
            "id": conv_id,
            "order_id": "unknown",
            "customer_number": payload.From,
            "message": text,
            "direction": "incoming",
            "provider": "whatsapp",
            "timestamp": datetime.now().isoformat()
        }
        db.setdefault("conversations", []).append(in_message)
        save_db(db)
        await sio.emit("new_chat", in_message)
        return {"success": False, "message": "No active order found."}

    conv_id = f"conv-{int(time.time() * 1000)}"
    in_message = {
        "id": conv_id,
        "order_id": order["id"],
        "customer_number": order["customerPhone"],
        "message": text,
        "direction": "incoming",
        "provider": "whatsapp",
        "timestamp": datetime.now().isoformat()
    }
    db.setdefault("conversations", []).append(in_message)
    order["customer_reply"] = text
    now = datetime.now()
    clean_text = text.upper()

    if "YES" in clean_text or "CONFIRM" in clean_text:
        order["confirmation_status"] = "Confirmed"
        order["confirmed_at"] = now.isoformat()
        order["confirmation_source"] = "whatsapp"
        order["status"] = "Preparing"
        order["timeline"].append({
            "status": "Confirmed",
            "timestamp": now.isoformat(),
            "title": "Order Confirmed via WhatsApp",
            "description": f"Customer replied: \"{text}\"."
        })
        save_db(db)

        start_order_simulation(order["id"])
        asyncio.create_task(queue_notification(order["id"], "success"))

        alert_notif = {
            "id": f"alert-{int(time.time() * 1000)}",
            "title": "Order Confirmed",
            "description": f"Customer {order['customerName']} has confirmed Order #{order['id'].split('-')[1] if '-' in order['id'] else order['id']}.",
            "type": "order",
            "timestamp": now.isoformat(),
            "read": False
        }
        db = load_db()
        db.setdefault("notifications", []).append(alert_notif)
        save_db(db)
        await sio.emit("new_notification", alert_notif)

    elif "NO" in clean_text or "CANCEL" in clean_text:
        order["confirmation_status"] = "Cancelled"
        order["cancelled_at"] = now.isoformat()
        order["confirmation_source"] = "whatsapp"
        order["status"] = "Cancelled"
        order["timeline"].append({
            "status": "Cancelled",
            "timestamp": now.isoformat(),
            "title": "Order Cancelled via WhatsApp",
            "description": f"Customer replied: \"{text}\"."
        })
        save_db(db)

        asyncio.create_task(queue_notification(order["id"], "cancellation"))

        alert_notif = {
            "id": f"alert-{int(time.time() * 1000)}",
            "title": "Order Cancelled",
            "description": f"Customer {order['customerName']} cancelled Order #{order['id'].split('-')[1] if '-' in order['id'] else order['id']}.",
            "type": "order",
            "timestamp": now.isoformat(),
            "read": False
        }
        db = load_db()
        db.setdefault("notifications", []).append(alert_notif)
        save_db(db)
        await sio.emit("new_notification", alert_notif)
    else:
        order["timeline"].append({
            "status": "Awaiting Clarification",
            "timestamp": now.isoformat(),
            "title": "Unrecognized Message Received",
            "description": f"Customer replied: \"{text}\". Expected YES or NO."
        })
        save_db(db)

    # Reload database object to get all updates
    db = load_db()
    updated_order = next((o for o in db["orders"] if o["id"] == order["id"]), order)
    await sio.emit("order_status", { "status": updated_order["status"], "timeline": updated_order["timeline"] }, room=order["id"])
    await sio.emit("order_confirmation_updated", updated_order)
    await sio.emit("new_chat", in_message)

    return {"success": True}

@app.post("/api/webhook/sms")
async def webhook_sms(payload: WebhookPayload):
    phone = normalize_phone(payload.From)
    text = (payload.Body or "").strip()
    print(f"[Webhook SMS] Incoming from normalize({payload.From}) -> {phone}: \"{text}\"")

    db = load_db()
    order = next((o for o in db.get("orders", []) if o.get("confirmation_status") == "Pending" and normalize_phone(o.get("customerPhone")) == phone), None)

    if not order:
        conv_id = f"conv-{int(time.time() * 1000)}"
        in_message = {
            "id": conv_id,
            "order_id": "unknown",
            "customer_number": payload.From,
            "message": text,
            "direction": "incoming",
            "provider": "sms",
            "timestamp": datetime.now().isoformat()
        }
        db.setdefault("conversations", []).append(in_message)
        save_db(db)
        await sio.emit("new_chat", in_message)
        return {"success": False, "message": "No active order found."}

    conv_id = f"conv-{int(time.time() * 1000)}"
    in_message = {
        "id": conv_id,
        "order_id": order["id"],
        "customer_number": order["customerPhone"],
        "message": text,
        "direction": "incoming",
        "provider": "sms",
        "timestamp": datetime.now().isoformat()
    }
    db.setdefault("conversations", []).append(in_message)
    order["customer_reply"] = text
    now = datetime.now()
    clean_text = text.upper()

    if "YES" in clean_text or "CONFIRM" in clean_text:
        order["confirmation_status"] = "Confirmed"
        order["confirmed_at"] = now.isoformat()
        order["confirmation_source"] = "sms"
        order["status"] = "Preparing"
        order["timeline"].append({
            "status": "Confirmed",
            "timestamp": now.isoformat(),
            "title": "Order Confirmed via SMS",
            "description": f"Customer replied: \"{text}\"."
        })
        save_db(db)

        start_order_simulation(order["id"])
        asyncio.create_task(queue_notification(order["id"], "success"))

        alert_notif = {
            "id": f"alert-{int(time.time() * 1000)}",
            "title": "Order Confirmed",
            "description": f"Customer {order['customerName']} has confirmed Order #{order['id'].split('-')[1] if '-' in order['id'] else order['id']}.",
            "type": "order",
            "timestamp": now.isoformat(),
            "read": False
        }
        db = load_db()
        db.setdefault("notifications", []).append(alert_notif)
        save_db(db)
        await sio.emit("new_notification", alert_notif)

    elif "NO" in clean_text or "CANCEL" in clean_text:
        order["confirmation_status"] = "Cancelled"
        order["cancelled_at"] = now.isoformat()
        order["confirmation_source"] = "sms"
        order["status"] = "Cancelled"
        order["timeline"].append({
            "status": "Cancelled",
            "timestamp": now.isoformat(),
            "title": "Order Cancelled via SMS",
            "description": f"Customer replied: \"{text}\"."
        })
        save_db(db)

        asyncio.create_task(queue_notification(order["id"], "cancellation"))

        alert_notif = {
            "id": f"alert-{int(time.time() * 1000)}",
            "title": "Order Cancelled",
            "description": f"Customer {order['customerName']} cancelled Order #{order['id'].split('-')[1] if '-' in order['id'] else order['id']}.",
            "type": "order",
            "timestamp": now.isoformat(),
            "read": False
        }
        db = load_db()
        db.setdefault("notifications", []).append(alert_notif)
        save_db(db)
        await sio.emit("new_notification", alert_notif)
    else:
        order["timeline"].append({
            "status": "Awaiting Clarification",
            "timestamp": now.isoformat(),
            "title": "Unrecognized Message Received",
            "description": f"Customer replied: \"{text}\". Expected YES or NO."
        })
        save_db(db)

    db = load_db()
    updated_order = next((o for o in db["orders"] if o["id"] == order["id"]), order)
    await sio.emit("order_status", { "status": updated_order["status"], "timeline": updated_order["timeline"] }, room=order["id"])
    await sio.emit("order_confirmation_updated", updated_order)
    await sio.emit("new_chat", in_message)

    return {"success": True}

@app.post("/api/orders/confirm")
async def force_confirm(payload: OrderIdPayload):
    db = load_db()
    order = next((o for o in db.get("orders", []) if o["id"] == payload.orderId), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    now = datetime.now()
    order["confirmation_status"] = "Confirmed"
    order["confirmed_at"] = now.isoformat()
    order["confirmation_source"] = "admin"
    order["status"] = "Preparing"
    order["timeline"].append({
        "status": "Confirmed",
        "timestamp": now.isoformat(),
        "title": "Force Confirmed by Admin",
        "description": "Admin manually confirmed this order."
    })
    save_db(db)

    start_order_simulation(payload.orderId)
    await sio.emit("order_status", { "status": order["status"], "timeline": order["timeline"] }, room=payload.orderId)
    await sio.emit("order_confirmation_updated", order)

    return {"success": True, "order": order}

class CancelPayload(BaseModel):
    orderId: str
    reason: Optional[str] = "Admin Cancelled"

@app.post("/api/orders/cancel")
async def force_cancel(payload: CancelPayload):
    db = load_db()
    order = next((o for o in db.get("orders", []) if o["id"] == payload.orderId), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    now = datetime.now()
    order["confirmation_status"] = "Cancelled"
    order["cancelled_at"] = now.isoformat()
    order["confirmation_source"] = "admin"
    order["status"] = "Cancelled"
    order["timeline"].append({
        "status": "Cancelled",
        "timestamp": now.isoformat(),
        "title": "Force Cancelled by Admin",
        "description": f"Admin manually cancelled this order. Reason: {payload.reason}"
    })
    save_db(db)

    await sio.emit("order_status", { "status": order["status"], "timeline": order["timeline"] }, room=payload.orderId)
    await sio.emit("order_confirmation_updated", order)

    return {"success": True, "order": order}

@app.get("/api/orders/confirmation-history")
def get_confirmation_history():
    db = load_db()
    return [o for o in db.get("orders", []) if o.get("confirmation_requested_at") is not None]

@app.get("/api/orders/logs")
def get_logs():
    db = load_db()
    return db.get("notifications", [])

@app.post("/api/orders/resend")
async def resend_confirmation(payload: ResendPayload):
    db = load_db()
    order = next((o for o in db.get("orders", []) if o["id"] == payload.orderId), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order["timeline"].append({
        "status": "Resending",
        "timestamp": datetime.now().isoformat(),
        "title": f"Resend Requested ({payload.channel})",
        "description": "Admin requested manual resending of the confirmation template."
    })
    save_db(db)

    asyncio.create_task(queue_notification(payload.orderId, "confirmation"))
    return {"success": True}

@app.get("/api/analytics/order-confirmation")
def get_order_confirmation_analytics():
    db = load_db()
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
async def simulate_time_leap(payload: SimulateTimeLeapPayload):
    db = load_db()
    order = next((o for o in db.get("orders", []) if o["id"] == payload.orderId), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    req_at_str = order.get("confirmation_requested_at")
    requested_at = datetime.fromisoformat(req_at_str) if req_at_str else datetime.now()

    offset = timedelta(hours=payload.hours)
    order["confirmation_requested_at"] = (requested_at - offset).isoformat()

    for step in order.get("timeline", []):
        if step["status"] == "Pending Confirmation" or "Sent" in step["status"]:
            try:
                t_val = datetime.fromisoformat(step["timestamp"])
                step["timestamp"] = (t_val - offset).isoformat()
            except ValueError:
                pass

    save_db(db)

    await sio.emit("order_status", { "status": order["status"], "timeline": order["timeline"] }, room=payload.orderId)
    await sio.emit("order_confirmation_updated", order)

    print(f"[Time Leap Simulator] Order {payload.orderId} timestamp shifted back by {payload.hours} hours.")

    await run_schedule_check()

    db = load_db()
    updated_order = next((o for o in db["orders"] if o["id"] == payload.orderId), order)
    return {"success": True, "order": updated_order}

@app.get("/api/orders/conversations/{order_id}")
def get_conversations(order_id: str):
    db = load_db()
    return [c for c in db.get("conversations", []) if c.get("order_id") == order_id]

@app.get("/api/orders/settings")
def get_settings():
    db = load_db()
    return db.get("communicationSettings", {})

@app.post("/api/orders/settings")
async def save_settings(request: Request):
    new_settings = await request.json()
    db = load_db()
    db["communicationSettings"] = new_settings
    save_db(db)

    await sio.emit("communication_settings_updated", new_settings)
    return {"success": True, "settings": new_settings}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="127.0.0.1", port=8000)
