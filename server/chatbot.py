import os
import re
import time
from typing import Dict, Any, List
from dotenv import load_dotenv

# Load env variables from root directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnableSequence

# Define Route Constants
DASHBOARD_ROUTES = {
    'orders': '/orders',
    'customers': '/customers',
    'delivery': '/delivery-partners',
    'inventory': '/inventory',
    'products': '/products',
    'coupons': '/coupons',
    'payments': '/payments',
    'reports': '/reports-analytics',
    'reviews': '/reviews-complaints',
    'outlets': '/outlet-management',
    'users': '/user-management',
    'roles': '/role-permissions',
    'banners': '/banner-cms',
    'audit': '/audit-logs',
    'settings': '/settings',
    'dashboard': '/dashboard'
}

def infer_route(question: str) -> str:
    q = question.lower()
    if any(k in q for k in ['order', 'dispatch', 'prepar', 'refund', 'cancel']):
        return DASHBOARD_ROUTES['orders']
    if any(k in q for k in ['customer', 'wallet', 'reward', 'block', 'points']):
        return DASHBOARD_ROUTES['customers']
    if any(k in q for k in ['rider', 'delivery partner', 'driver', 'gps', 'vehicle']):
        return DASHBOARD_ROUTES['delivery']
    if any(k in q for k in ['stock', 'inventory', 'raw', 'material', 'supplier', 'qty']):
        return DASHBOARD_ROUTES['inventory']
    if any(k in q for k in ['product', 'menu', 'item', 'dish', 'availability', 'burger', 'pizza', 'toast', 'matcha', 'latte', 'wings', 'salad']):
        return DASHBOARD_ROUTES['products']
    if any(k in q for k in ['coupon', 'promo', 'offer', 'discount', 'welcome50']):
        return DASHBOARD_ROUTES['coupons']
    if any(k in q for k in ['payment', 'transaction', 'settlement', 'finance', 'upi', 'card', 'cash']):
        return DASHBOARD_ROUTES['payments']
    if any(k in q for k in ['report', 'analytic', 'revenue', 'sales', 'earnings']):
        return DASHBOARD_ROUTES['reports']
    if any(k in q for k in ['ticket', 'complaint', 'review', 'feedback', 'soggy', 'cold', 'late']):
        return DASHBOARD_ROUTES['reviews']
    if any(k in q for k in ['outlet', 'branch', 'store', 'location', 'downtown', 'metro', 'plaza', 'suburbs']):
        return DASHBOARD_ROUTES['outlets']
    if any(k in q for k in ['user', 'staff', 'admin account']):
        return DASHBOARD_ROUTES['users']
    if any(k in q for k in ['role', 'permission', 'rbac', 'access']):
        return DASHBOARD_ROUTES['roles']
    if any(k in q for k in ['banner', 'cms', 'homepage']):
        return DASHBOARD_ROUTES['banners']
    if any(k in q for k in ['audit', 'log', 'history', 'activity']):
        return DASHBOARD_ROUTES['audit']
    if any(k in q for k in ['setting', 'api', 'config', 'backup']):
        return DASHBOARD_ROUTES['settings']
    return DASHBOARD_ROUTES['dashboard']

def build_dashboard_snapshot(db: dict) -> dict:
    orders = db.get("orders", [])
    products = db.get("products", [])
    customers = db.get("customers", [])
    riders = db.get("deliveryPartners", [])
    outlets = db.get("outlets", [])
    coupons = db.get("coupons", [])
    materials = db.get("rawMaterials", [])
    tickets = db.get("tickets", [])
    banners = db.get("banners", [])
    
    active_orders = [o for o in orders if o.get("status") in ['Pending', 'Preparing', 'Ready', 'Out for Delivery']]
    paid_orders = [o for o in orders if o.get("paymentStatus") == 'Paid']
    open_tickets = [t for t in tickets if t.get("status") in ['Open', 'In Progress']]
    low_stock = [m for m in materials if float(m.get("stock", 0)) <= float(m.get("minStockAlert", 0))]
    available_riders = [r for r in riders if r.get("status") == 'Available']
    active_coupons = [c for c in coupons if c.get("status") == 'Active']
    blocked_customers = [c for c in customers if c.get("status") == 'Blocked']
    revenue = sum(float(o.get("total", 0)) for o in paid_orders)
    
    return {
        "totals": {
            "orders": len(orders),
            "activeOrders": len(active_orders),
            "revenue": revenue,
            "customers": len(customers),
            "blockedCustomers": len(blocked_customers),
            "riders": len(riders),
            "availableRiders": len(available_riders),
            "outlets": len(outlets),
            "products": len(products),
            "availableProducts": len([p for p in products if p.get("availability")]),
            "activeCoupons": len(active_coupons),
            "lowStockItems": len(low_stock),
            "openTickets": len(open_tickets),
            "activeBanners": len([b for b in banners if b.get("status") == 'Active'])
        },
        "highlights": {
            "activeOrders": [
                {
                    "id": o.get("id"),
                    "customer": o.get("customerName"),
                    "outlet": o.get("outletName"),
                    "status": o.get("status"),
                    "total": f"${float(o.get('total', 0)):.2f}",
                    "payment": o.get("paymentStatus")
                } for o in active_orders
            ],
            "lowStock": [
                {
                    "name": m.get("name"),
                    "stock": f"{m.get('stock')} {m.get('unit')}",
                    "min": f"{m.get('minStockAlert')} {m.get('unit')}",
                    "supplier": m.get("supplier")
                } for m in low_stock
            ],
            "openTickets": [
                {
                    "id": t.get("id"),
                    "orderId": t.get("orderId"),
                    "customer": t.get("customerName"),
                    "issue": t.get("issueType"),
                    "priority": t.get("priority"),
                    "status": t.get("status")
                } for t in open_tickets
            ],
            "availableRiders": [
                {
                    "id": r.get("id"),
                    "name": r.get("name"),
                    "vehicle": r.get("vehicleType"),
                    "rating": r.get("rating")
                } for r in available_riders
            ]
        }
    }

def format_snapshot_text(snapshot: dict) -> str:
    t = snapshot["totals"]
    return "\n".join([
        f"Generated At: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"Orders: {t['orders']} total, {t['activeOrders']} active. Paid Revenue: ${t['revenue']:.2f}",
        f"Customers: {t['customers']} total, {t['blockedCustomers']} blocked.",
        f"Riders: {t['riders']} total, {t['availableRiders']} available.",
        f"Outlets: {t['outlets']} total. Products: {t['products']} total ({t['availableProducts']} active).",
        f"Low Stock Items: {t['lowStockItems']}. Open Tickets: {t['openTickets']}. Active Coupons: {t['activeCoupons']}.",
        f"Active Orders Highlights: {snapshot['highlights']['activeOrders'][:3]}",
        f"Low Stock Highlights: {snapshot['highlights']['lowStock'][:3]}",
        f"Open Tickets Highlights: {snapshot['highlights']['openTickets'][:3]}",
        f"Available Riders Highlights: {snapshot['highlights']['availableRiders'][:3]}"
    ])

def local_semantic_agent(input_data: dict) -> str:
    question = input_data.get("question", "").strip()
    db = input_data.get("db", {})
    history = input_data.get("history", "")
    snapshot = build_dashboard_snapshot(db)
    
    q = question.lower()
    
    # 1. Greetings
    query_words = set(re.findall(r'\w+', q))
    if any(w in query_words for w in ['hello', 'hi', 'hey', 'namaste', 'greetings', 'help']) or 'what can you do' in q:
        t = snapshot["totals"]
        return (
            f"Hello! I'm **DelivoBot**, your LangChain admin assistant. "
            f"I have direct access to your database snapshot and can answer questions about orders, products, customers, and inventory.\n\n"
            f"**Current Status Summary:**\n"
            f"- 📦 **{t['activeOrders']} active orders** are currently in progress.\n"
            f"- 🛵 **{t['availableRiders']} riders** are available for dispatch.\n"
            f"- ⚠️ **{t['lowStockItems']} items** have triggered low-stock alerts.\n"
            f"- 🎫 **{t['openTickets']} tickets** are active in the support queue.\n\n"
            f"Ask me about any specific order (e.g. 'order-101'), customer profile (e.g. 'Bruce Wayne'), or stock item!"
        )
    
    # 2. Products / Menu items search (e.g. "pizza", "burger", "latte", "salad", "wings", "toast")
    products = db.get("products", [])
    matched_products = []
    
    query_words = set(re.findall(r'\w+', q))
    for p in products:
        name_words = set(re.findall(r'\w+', p.get("name", "").lower()))
        common_words = name_words.intersection(query_words)
        matching_keywords = [w for w in common_words if len(w) > 3 or w in ['veg', 'egg']]
        
        if matching_keywords or p.get("subcategory", "").lower() in q or p.get("category", "").lower() in q:
            matched_products.append(p)
            
    if matched_products:
        prod_details = []
        for p in matched_products[:3]: # limit to 3 matches max
            avail_status = "🟢 Available" if p.get("availability") else "🔴 Out of Stock"
            veg_tag = "🥬 Veg" if p.get("isVeg") else "🥩 Non-Veg"
            best_seller_tag = "⭐ Bestseller" if p.get("isBestSeller") else ""
            discount_info = f"({p.get('discount')}% Off)" if p.get("discount", 0) > 0 else ""
            
            prod_details.append(
                f"### 🍔 **{p.get('name')}** {best_seller_tag}\n"
                f"- **Category**: {p.get('category')} ({p.get('subcategory')}) | **Tag**: {veg_tag}\n"
                f"- **Price**: **${p.get('price'):.2f}** {discount_info}\n"
                f"- **Availability**: **{avail_status}**\n"
                f"- **Prep Time**: `{p.get('preparationTime')} mins`\n"
                f"- **Description**: *{p.get('description')}*"
            )
        
        products_str = "\n\n".join(prod_details)
        return (
            f"Here are the matching products from the menu registry:\n\n"
            f"{products_str}\n\n"
            f"You can toggle availability or edit parameters in the [Central Menu & Products Registry](/products)."
        )

    # 3. Specific Order Details Lookups (e.g. order-101 or context reference from history)
    target_order_id = None
    order_match = re.search(r'order-(\d+)', q)
    if order_match:
        target_order_id = f"order-{order_match.group(1)}"
    else:
        # Check if the query asks about a previous order status/payment/rider/address/items
        relative_words = ['status', 'paid', 'payment', 'rider', 'deliver', 'address', 'items', 'where', 'who', 'cancel', 'refund', 'it', 'him', 'her']
        if any(w in q for w in relative_words):
            history_orders = re.findall(r'order-(\d+)', history.lower())
            if history_orders:
                target_order_id = f"order-{history_orders[-1]}"

    if target_order_id:
        orders = db.get("orders", [])
        order = next((o for o in orders if o.get("id", "").lower() == target_order_id), None)
        if order:
            if 'paid' in q or 'payment' in q:
                return f"💰 The payment status for Order **{order.get('id')}** is **{order.get('paymentStatus')}** via **{order.get('paymentMethod')}** (Total: **${float(order.get('total', 0)):.2f}**)."
            if 'rider' in q or 'who' in q or 'delivery partner' in q:
                if order.get('deliveryPartnerId'):
                    riders = db.get("deliveryPartners", [])
                    rider = next((r for r in riders if r.get("id") == order.get('deliveryPartnerId')), None)
                    rider_name = rider.get("name") if rider else "Assigned Rider"
                    return f"🛵 Order **{order.get('id')}** is assigned to rider **{rider_name}** (ID: `{order.get('deliveryPartnerId')}`)."
                return f"🛵 Order **{order.get('id')}** does not have an assigned rider yet. You can assign one in the [Orders Page](/orders)."
            if 'status' in q or 'where' in q:
                return f"📦 Order **{order.get('id')}** is currently in **{order.get('status')}** stage. Current timeline event: *{order.get('timeline', [{}])[-1].get('description')}*."
            if 'address' in q or 'where' in q:
                return f"📍 The delivery address for Order **{order.get('id')}** is **{order.get('address')}**."
            
            items_str = "\n".join([
                f"  - {item.get('quantity')}x **{item.get('name')}** (${float(item.get('price', 0)):.2f})"
                for item in order.get("items", [])
            ])
            timeline_str = "\n".join([
                f"  - *{t.get('timestamp')[:16]}* - **{t.get('title')}**: {t.get('description')}"
                for t in order.get("timeline", [])
            ])
            return (
                f"### 📦 Details for Order **{order.get('id')}**\n"
                f"- **Customer**: {order.get('customerName')} (📞 {order.get('customerPhone')})\n"
                f"- **Status**: `{order.get('status')}` | **Payment**: `{order.get('paymentStatus')}` via {order.get('paymentMethod')}\n"
                f"- **Outlet**: {order.get('outletName')}\n"
                f"- **Delivery Address**: {order.get('address')}\n"
                f"- **Bill Summary**: **${float(order.get('total', 0)):.2f}** (Subtotal: ${float(order.get('subtotal', 0)):.2f}, Tax: ${float(order.get('tax', 0)):.2f}, Rider Pay: ${float(order.get('deliveryCharge', 0)):.2f})\n\n"
                f"**Items Ordered:**\n{items_str}\n\n"
                f"**Status Timeline:**\n{timeline_str}\n\n"
                f"*Action: You can manage this order on the [Orders Page](/orders).*"
            )
        else:
            return f"I searched the database but could not find any order with ID **{target_order_id.upper()}**. Please double check the ID."

    # 4. Active Orders List
    if 'order' in q:
        orders = snapshot["highlights"]["activeOrders"]
        if not orders:
            return "There are no active orders in progress at the moment. You can view records on the [Orders Page](/orders)."
        orders_str = "\n".join([
            f"1. **{o['id']}** - {o['customer']} ({o['status']} - **{o['total']}** | Payment: {o['payment']})"
            for o in orders
        ])
        return (
            f"### 📋 Active Orders Overview ({snapshot['totals']['activeOrders']} Active)\n"
            f"{orders_str}\n\n"
            f"You can assign riders or update status codes in [Orders Desk](/orders)."
        )

    # 5. Low Stock / Inventory
    if any(k in q for k in ['stock', 'inventory', 'raw', 'material', 'supplier', 'qty']):
        low_stock_list = snapshot["highlights"]["lowStock"]
        if not low_stock_list:
            return "✅ **All raw materials are well stocked!** No inventory items are currently below their alert thresholds."
        stock_str = "\n".join([
            f"- ⚠️ **{item['name']}**: Stock is at `{item['stock']}` (Minimum required: `{item['min']}`) | Supplier: *{item['supplier']}*"
            for item in low_stock_list
        ])
        return (
            f"### 🪪 Low Stock Alert ({snapshot['totals']['lowStockItems']} items need attention)\n"
            f"{stock_str}\n\n"
            f"You can review suppliers and update stock logs in [Inventory Management](/inventory)."
        )

    # 6. Riders / Delivery Partners
    if any(k in q for k in ['rider', 'delivery partner', 'driver', 'gps', 'vehicle']):
        riders = snapshot["highlights"]["availableRiders"]
        totals = snapshot["totals"]
        if not riders:
            return (
                f"🛵 **Delivery Fleet Status:** All {totals['riders']} delivery partners are currently busy or offline. "
                f"You can track active deliveries on the [Delivery Partners Page](/delivery-partners)."
            )
        rider_str = "\n".join([
            f"- 🟢 **{r['name']}** - Rating: `{r['rating']}` | Vehicle: `{r['vehicle']}` (ID: `{r['id']}`)"
            for r in riders
        ])
        return (
            f"### 🛵 Available Delivery Partners ({totals['availableRiders']}/{totals['riders']} Available)\n"
            f"{rider_str}\n\n"
            f"Ready for assignments. Manage GPS coordinates on the [Delivery Partners Page](/delivery-partners)."
        )

    # 7. Customer lookup (e.g. "Marcus", "Bruce", "Clara" or context reference from history)
    target_customer = None
    customers = db.get("customers", [])
    for cust in customers:
        if cust.get("name", "").lower() in q or cust.get("id", "").lower() in q:
            target_customer = cust
            break
            
    if not target_customer:
        cust_relative_words = ['wallet', 'balance', 'points', 'reward', 'address', 'phone', 'email', 'blocked', 'he', 'she', 'his', 'her']
        if any(w in q for w in cust_relative_words):
            for cust in customers:
                if cust.get("name", "").lower() in history.lower():
                    target_customer = cust
                    
    if target_customer:
        if 'wallet' in q or 'balance' in q:
            return f"💵 **{target_customer.get('name')}** has a wallet balance of **${float(target_customer.get('walletBalance', 0)):.2f}**."
        if 'points' in q or 'reward' in q:
            return f"🪙 **{target_customer.get('name')}** has **{target_customer.get('rewardPoints', 0):,}** reward points."
        if 'address' in q or 'live' in q:
            addr_str = ", ".join(target_customer.get("addresses", []))
            return f"📍 The registered addresses for **{target_customer.get('name')}** are: {addr_str or 'No address saved'}."
        if 'phone' in q or 'email' in q or 'contact' in q:
            return f"📞 Contact details for **{target_customer.get('name')}**: Phone: {target_customer.get('phone')}, Email: {target_customer.get('email')}."
        
        addr_str = ", ".join(target_customer.get("addresses", []))
        fav_str = ", ".join(target_customer.get("favoriteItems", []))
        return (
            f"### 👤 Customer Profile: **{target_customer.get('name')}**\n"
            f"- **Customer ID**: `{target_customer.get('id')}` | Status: `{'🟢 Active' if target_customer.get('status') == 'Active' else '🔴 Blocked'}`\n"
            f"- **Contact**: {target_customer.get('email')} (📞 {target_customer.get('phone')})\n"
            f"- **Wallet Balance**: **${float(target_customer.get('walletBalance', 0)):.2f}**\n"
            f"- **Reward Points**: `{target_customer.get('rewardPoints', 0):,} Points`\n"
            f"- **Delivery Addresses**: {addr_str or 'No address saved'}\n"
            f"- **Favorite Dishes**: {fav_str or 'None recorded'}\n\n"
            f"*Action: View transactions or apply wallet balance adjustments on [Customer Profiles](/customers).*"
        )

    if 'customer' in q:
        totals = snapshot["totals"]
        return (
            f"### 👥 Customers Directory Summary\n"
            f"- **Total Registered Customers**: {totals['customers']}\n"
            f"- **Blocked Accounts**: {totals['blockedCustomers']} (requires review)\n\n"
            f"Please search for a customer name specifically (e.g. 'Tell me about Bruce Wayne') or visit the [Customer Registry](/customers)."
        )

    # 8. Support Tickets / Reviews
    if any(k in q for k in ['ticket', 'complaint', 'review', 'feedback', 'soggy', 'cold', 'late']):
        tickets = snapshot["highlights"]["openTickets"]
        totals = snapshot["totals"]
        if not tickets:
            return "✅ **Support Queue is empty!** There are no open or in-progress tickets at this time."
        tickets_str = "\n".join([
            f"- **{t['id']}** ({t['priority']} Priority) - *{t['customer']}* regarding '{t['issue']}' (Status: `{t['status']}`)"
            for t in tickets
        ])
        return (
            f"### 🎫 Support Queue Summary ({totals['openTickets']} Open Tickets)\n"
            f"{tickets_str}\n\n"
            f"You can resolve these issues and contact customers in [Reviews & Support](/reviews-complaints)."
        )

    # 8. Revenue & Sales
    if any(k in q for k in ['revenue', 'sales', 'report', 'analytic', 'earnings']):
        totals = snapshot["totals"]
        return (
            f"### 📈 Business Performance Snapshot\n"
            f"- **Paid Order Revenue**: **${totals['revenue']:.2f}**\n"
            f"- **Total Completed/Active Orders**: {totals['orders']} orders\n"
            f"- **Outlets Registered**: {totals['outlets']} locations\n\n"
            f"For visual charts, outlet breakdown, and CSV exports, visit the [Reports & Analytics Page](/reports-analytics)."
        )

    # 9. Coupons / Offers
    if any(k in q for k in ['coupon', 'promo', 'offer', 'discount', 'welcome50']):
        coupons = db.get("coupons", [])
        coupon_str = "\n".join([
            f"- 🎫 **{c.get('code')}**: {c.get('discountType')} {c.get('value')} Off (Min Order: ${c.get('minOrderValue')}) | Status: `{'🟢 Active' if c.get('status') == 'Active' else '🔴 ' + c.get('status')}`"
            for c in coupons
        ])
        return (
            f"### 🏷️ Coupons & Marketing Offers\n"
            f"{coupon_str}\n\n"
            f"Create, pause, or edit campaign rules on the [Coupons & Offers](/coupons) page."
        )

    # 10. Outlets
    if any(k in q for k in ['outlet', 'branch', 'store', 'location', 'downtown', 'metro', 'plaza', 'suburbs']):
        outlets = db.get("outlets", [])
        outlet_str = "\n".join([
            f"- 🏢 **{o.get('name')}** ({o.get('hours')}) | Manager: {o.get('manager')} | Revenue: **${float(o.get('revenue', 0)):.2f}** ({o.get('ordersCount')} orders)"
            for o in outlets
        ])
        return (
            f"### 🏢 Outlet Management Directory\n"
            f"{outlet_str}\n\n"
            f"Adjust outlet settings and operating hours in [Outlet Management](/outlet-management)."
        )

    # Fallback default snapshot overview
    t = snapshot["totals"]
    return (
        f"### 📋 Live Delivo Admin Snapshot\n"
        f"- **Active Orders**: `{t['activeOrders']}` in progress\n"
        f"- **Riders Available**: `{t['availableRiders']}` ready for dispatch\n"
        f"- **Low Stock Alerts**: `{t['lowStockItems']}` raw ingredients\n"
        f"- **Support Queue**: `{t['openTickets']}` tickets pending\n"
        f"- **Revenue**: `${t['revenue']:.2f}` paid to date\n\n"
        f"Please ask about a specific screen or item, or click a quick reply below!"
    )

# LangChain Local Chain definition using RunnableLambda
local_chain = RunnableSequence(
    RunnableLambda(local_semantic_agent),
    StrOutputParser()
)

def create_llm_chain():
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    
    if gemini_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            model = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=gemini_key,
                temperature=0.2
            )
            source = "langchain-gemini"
        except Exception:
            return None, None
    elif openai_key:
        try:
            from langchain_openai import ChatOpenAI
            model = ChatOpenAI(
                model="gpt-4o-mini",
                api_key=openai_key,
                temperature=0.2
            )
            source = "langchain-openai"
        except Exception:
            return None, None
    else:
        return None, None
        
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are DelivoBot, a senior admin assistant inside a food delivery admin dashboard.\n"
                   "Answer professionally, concisely, and actionably for an admin user.\n"
                   "Use the dashboard context provided. If data is missing, suggest where the admin can navigate to.\n"
                   "Use clean Markdown with bold text, lists, or tables where appropriate.\n"
                   "Mention relevant routes using markdown links matching their routes if applicable (e.g. [Orders page](/orders)).\n"
                   "Routes available: {routes_json}"),
        ("human", "Dashboard context:\n{context}\n\nConversation History:\n{history}\n\nAdmin Question: {question}")
    ])
    
    chain = prompt | model | StrOutputParser()
    return chain, source

async def answer_chat(message: str, history: List[Dict[str, Any]] = None, db: Dict[str, Any] = None) -> Dict[str, Any]:
    started_at = time.time()
    question = str(message or "").strip()
    
    if not question:
        return {
            "reply": "Please type a question about orders, customers, inventory, riders, reports, or settings.",
            "source": "validation",
            "route": DASHBOARD_ROUTES["dashboard"],
            "latencyMs": 0
        }
        
    db = db or {}
    snapshot = build_dashboard_snapshot(db)
    route = infer_route(question)
    
    # Process history
    history_list = history if isinstance(history, list) else []
    safe_history = "\n".join([
        f"{'Admin' if h.get('sender') == 'user' else 'DelivoBot'}: {str(h.get('text', ''))[:500]}"
        for h in history_list[-8:]
    ])
    
    llm_chain, llm_source = create_llm_chain()
    
    if llm_chain:
        try:
            context_text = format_snapshot_text(snapshot)
            reply = await llm_chain.ainvoke({
                "question": question,
                "history": safe_history or "No prior conversation.",
                "context": context_text,
                "routes_json": str(DASHBOARD_ROUTES)
            })
            
            return {
                "reply": reply,
                "source": llm_source,
                "route": route,
                "latencyMs": int((time.time() - started_at) * 1000)
            }
        except Exception as e:
            print(f"LangChain LLM invocation failed, using local chain fallback: {str(e)}")
            
    # Fallback to local semantic chain
    reply = await local_chain.ainvoke({"question": question, "db": db, "history": safe_history})
    return {
        "reply": reply,
        "source": "langchain-local-rag",
        "route": route,
        "latencyMs": int((time.time() - started_at) * 1000)
    }
