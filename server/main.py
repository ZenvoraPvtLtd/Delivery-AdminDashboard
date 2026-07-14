from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
import sys
from datetime import datetime

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

DB_FILE = os.path.join(os.path.dirname(__file__), "db.json")

# Initial mock data fallback
INITIAL_DB = {
  "outlets": [
    { "id": "out-1", "name": "Downtown Central Outlet", "address": "124 Market St, Downtown", "manager": "Sarah Jenkins", "phone": "+1 555-0192", "status": "Open", "revenue": 15480, "ordersCount": 420, "taxNumber": "GST-33AABCC1234D", "hours": "08:00 AM - 11:00 PM" },
    { "id": "out-2", "name": "West End Cafe", "address": "482 Broadway Rd, West End", "manager": "David Miller", "phone": "+1 555-0144", "status": "Open", "revenue": 9820, "ordersCount": 260, "taxNumber": "GST-33AABCC5678E", "hours": "09:00 AM - 10:00 PM" },
    { "id": "out-3", "name": "Metro Plaza Food Court", "address": "Suite 12, Metro Mall, Plaza St", "manager": "Elena Rostova", "phone": "+1 555-0188", "status": "Open", "revenue": 21300, "ordersCount": 650, "taxNumber": "GST-33AABCC9012F", "hours": "10:00 AM - 11:30 PM" },
    { "id": "out-4", "name": "North Suburbs Delivery Kitchen", "address": "Industrial Area Phase 2", "manager": "Rajesh Sharma", "phone": "+1 555-0165", "status": "Open", "revenue": 6400, "ordersCount": 180, "taxNumber": "GST-33AABCC4321G", "hours": "11:00 AM - 02:00 AM" }
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
      ]
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
      ]
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
  "tickets": [],
  "auditLogs": [],
  "customers": [
    { "id": "cust-1", "name": "Marcus Aurelius", "phone": "+1 555-8921", "email": "marcus@philosophy.com", "walletBalance": 42.50, "rewardPoints": 1200, "status": "Active", "addresses": ["Apt 4B, 32 Wall Street, Financial District, NY"], "favoriteItems": ["Truffle Mushroom Burger"] },
    { "id": "cust-2", "name": "Clara Oswald", "phone": "+1 555-4429", "email": "clara@tardis.co.uk", "walletBalance": 15.00, "rewardPoints": 450, "status": "Active", "addresses": ["Floor 14, 52 Hudson Yards, Midtown West, NY"], "favoriteItems": ["Iced Vanilla Matcha Latte"] },
    { "id": "cust-3", "name": "Bruce Wayne", "phone": "+1 555-7700", "email": "bruce@waynecorp.com", "walletBalance": 9800.00, "rewardPoints": 95000, "status": "Active", "addresses": ["Penthouse A, Wayne Tower, Manhattan, NY", "Wayne Manor, Bristol County, NJ"], "favoriteItems": ["Premium Veggie Salad Bowl"] }
  ],
  "banners": [
    { "id": "ban-1", "title": "Monsoon Special Combo 25%", "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600", "status": "Active", "type": "Homepage", "schedule": "2026-07-01 to 2026-07-31" }
  ]
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

class OrderStatusUpdate(BaseModel):
    status: str
    updatedBy: str

class RiderAssign(BaseModel):
    riderId: str
    updatedBy: str

class WalletUpdate(BaseModel):
    amount: float

class StatusUpdate(BaseModel):
    status: str

class AddressesUpdate(BaseModel):
    addresses: List[str]

@app.get("/api/db")
def get_db():
    return load_db()

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

@app.post("/api/orders/{order_id}/status")
def update_order_status(order_id: str, payload: OrderStatusUpdate):
    db = load_db()
    for o in db.get("orders", []):
        if o["id"] == order_id:
            o["status"] = payload.status
            o["timeline"].append({
                "status": payload.status,
                "timestamp": datetime.now().isoformat(),
                "title": f"Status Updated to {payload.status}",
                "description": f"Order status set by {payload.updatedBy}."
            })
            if payload.status == "Delivered":
                o["paymentStatus"] = "Paid"
            elif payload.status == "Cancelled":
                o["paymentStatus"] = "Refunded"
            save_db(db)
            return {"success": True, "order": o}
    raise HTTPException(status_code=404, detail="Order not found")

@app.post("/api/orders/{order_id}/assign-rider")
def assign_rider(order_id: str, payload: RiderAssign):
    db = load_db()
    order = None
    rider = None
    for o in db.get("orders", []):
        if o["id"] == order_id:
            order = o
            break
    for r in db.get("deliveryPartners", []):
        if r["id"] == payload.riderId:
            rider = r
            break
    
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
        return {"success": True, "order": order, "rider": rider}
    raise HTTPException(status_code=404, detail="Order or Rider not found")

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
        "id": f"log-{int(datetime.now().timestamp() * 1000)}",
        "timestamp": datetime.now().isoformat(),
        **payload
    }
    db.setdefault("auditLogs", []).insert(0, log)
    save_db(db)
    return {"success": True, "log": log}

class TimelineEvent(BaseModel):
    status: str
    timestamp: str
    title: str
    description: str

class OrderItem(BaseModel):
    productId: str
    name: str
    quantity: int
    price: float
    isVeg: bool

class NewOrderPayload(BaseModel):
    id: str
    customerId: str
    customerName: str
    customerPhone: str
    outletId: str
    outletName: str
    items: List[OrderItem]
    subtotal: float
    tax: float
    deliveryCharge: float
    packagingCharge: float
    discount: float
    total: float
    status: str
    paymentStatus: str
    paymentMethod: str
    createdAt: str
    address: str
    timeline: List[TimelineEvent]
    orderType: str

@app.post("/api/orders")
def create_order(payload: NewOrderPayload):
    db = load_db()
    if any(o["id"] == payload.id for o in db.get("orders", [])):
        return {"success": True, "message": "Order already exists"}
    
    db.setdefault("orders", []).insert(0, payload.model_dump())
    save_db(db)
    return {"success": True, "order": payload}

if __name__ == "__main__":
    import uvicorn
    # Start the FastAPI application on 127.0.0.1:8000
    uvicorn.run(app, host="127.0.0.1", port=8000)
