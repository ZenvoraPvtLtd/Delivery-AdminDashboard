from loguru import logger
from datetime import datetime, timezone
from app.models.role import Role
from app.models.user import User
from app.models.product import Product
from app.models.inventory import InventoryItem, PurchaseOrder
from app.models.delivery_partner import DeliveryPartner
from app.models.customer import Customer
from app.models.promotion import Coupon
from app.models.support import Review, SupportTicket
from app.models.cms import Banner
from app.models.order import Order
from app.models.outlet import Outlet
from app.constants.roles import Role as RoleEnum
from app.core.config import settings
from app.security.password import get_password_hash

async def run_seeder():
    logger.info("Running Enterprise Database Seeder...")
    
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

    # 3. Seed Outlets if empty
    outlet_count = await Outlet.count()
    if outlet_count == 0:
        sample_outlets = [
            Outlet(outlet_id="out-1", name="Downtown Central Outlet", address="124 Market St, Downtown", manager="Sarah Jenkins", phone="+1 555-0192", status="Open", revenue=15480.0, orders_count=420),
            Outlet(outlet_id="out-2", name="West End Cafe", address="482 Broadway Rd, West End", manager="David Miller", phone="+1 555-0144", status="Open", revenue=9820.0, orders_count=260),
            Outlet(outlet_id="out-3", name="Metro Plaza Food Court", address="Suite 12, Metro Mall, Plaza St", manager="Elena Rostova", phone="+1 555-0188", status="Open", revenue=21300.0, orders_count=650)
        ]
        for o in sample_outlets:
            await o.insert()
        logger.info(f"Seeded {len(sample_outlets)} outlets.")

    # 4. Seed Products if empty
    product_count = await Product.count()
    if product_count == 0:
        sample_products = [
            Product(
                sku="PRD-TRUFFLE-BURG",
                name="Truffle Mushroom Burger",
                slug="truffle-mushroom-burger",
                category="Fast Food",
                subcategory="Burgers",
                mrp=14.99,
                selling_price=12.99,
                cost_price=5.50,
                discount=10.0,
                gst=5.0,
                description="Freshly grilled portobello mushroom with melted cheese, truffle paste, and signature brioche bun.",
                images=["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"],
                status="Active",
                visibility=True,
                stock_quantity=150,
                is_veg=True,
                preparation_time=12,
                best_seller=True,
                outlet_ids=["out-1", "out-2", "out-3"]
            ),
            Product(
                sku="PRD-PEPPERONI-PIZZA",
                name="Spicy Pepperoni Pizza (12\")",
                slug="spicy-pepperoni-pizza",
                category="Italian",
                subcategory="Pizza",
                mrp=16.99,
                selling_price=16.99,
                cost_price=6.00,
                discount=0.0,
                gst=12.0,
                description="Crisp sourdough crust topped with spicy premium pepperoni slice, hand-stretched mozzarella, and tangy marinara.",
                images=["https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400"],
                status="Active",
                visibility=True,
                stock_quantity=200,
                is_veg=False,
                preparation_time=18,
                best_seller=True,
                outlet_ids=["out-1", "out-3", "out-4"]
            ),
            Product(
                sku="PRD-AVOCADO-TOAST",
                name="Avocado Toast with Poached Egg",
                slug="avocado-toast-poached-egg",
                category="Breakfast",
                subcategory="Toast",
                mrp=10.00,
                selling_price=9.50,
                cost_price=3.50,
                discount=5.0,
                gst=5.0,
                description="Smashed Haas avocados, flaky sea salt, organic eggs, sourdough bread toasted with organic butter.",
                images=["https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400"],
                status="Active",
                visibility=True,
                stock_quantity=80,
                is_veg=True,
                preparation_time=8,
                best_seller=False,
                outlet_ids=["out-1", "out-2"]
            ),
            Product(
                sku="PRD-MATCHA-LATTE",
                name="Iced Vanilla Matcha Latte",
                slug="iced-vanilla-matcha-latte",
                category="Beverages",
                subcategory="Teas",
                mrp=5.99,
                selling_price=5.99,
                cost_price=1.80,
                discount=0.0,
                gst=5.0,
                description="Ceremonial grade Japanese Uji matcha whisked with organic oat milk and natural vanilla pod syrup.",
                images=["https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400"],
                status="Active",
                visibility=True,
                stock_quantity=300,
                is_veg=True,
                preparation_time=4,
                best_seller=True,
                outlet_ids=["out-1", "out-2", "out-3", "out-4"]
            )
        ]
        for p in sample_products:
            await p.insert()
        logger.info(f"Seeded {len(sample_products)} sample products.")

    # 5. Seed Orders if empty
    order_count = await Order.count()
    if order_count == 0:
        sample_orders = [
            Order(
                order_id="order-101",
                customer_id="cust-1",
                customer_name="Marcus Aurelius",
                customer_phone="+1 555-8921",
                outlet_id="out-1",
                outlet_name="Downtown Central Outlet",
                items=[
                    {"productId": "prod-1", "name": "Truffle Mushroom Burger", "quantity": 2, "price": 12.99, "isVeg": True},
                    {"productId": "prod-4", "name": "Iced Vanilla Matcha Latte", "quantity": 1, "price": 5.99, "isVeg": True}
                ],
                subtotal=31.97,
                tax=1.60,
                delivery_charge=2.99,
                packaging_charge=1.50,
                discount=3.20,
                total=34.86,
                status="Preparing",
                payment_status="Paid",
                payment_method="UPI",
                address="Apt 4B, 32 Wall Street, Financial District, NY",
                order_type="Delivery",
                timeline=[
                    {"status": "Pending", "timestamp": datetime.now(timezone.utc).isoformat(), "title": "Order Placed", "description": "Customer placed order via Mobile App."},
                    {"status": "Preparing", "timestamp": datetime.now(timezone.utc).isoformat(), "title": "In Kitchen Prep", "description": "Order accepted by Kitchen Manager."}
                ]
            ),
            Order(
                order_id="order-102",
                customer_id="cust-2",
                customer_name="Bruce Wayne",
                customer_phone="+1 555-4920",
                outlet_id="out-1",
                outlet_name="Downtown Central Outlet",
                items=[
                    {"productId": "prod-2", "name": "Spicy Pepperoni Pizza (12\")", "quantity": 2, "price": 16.99, "isVeg": False}
                ],
                subtotal=33.98,
                tax=4.08,
                delivery_charge=3.50,
                packaging_charge=2.00,
                discount=0.00,
                total=43.56,
                status="Out for Delivery",
                payment_status="Paid",
                payment_method="Card",
                address="Wayne Manor, 100 Gotham Heights, NY",
                order_type="Delivery",
                timeline=[
                    {"status": "Pending", "timestamp": datetime.now(timezone.utc).isoformat(), "title": "Order Placed", "description": "Order received."},
                    {"status": "Out for Delivery", "timestamp": datetime.now(timezone.utc).isoformat(), "title": "Picked up by Rider", "description": "Handed to Alex Mercer."}
                ]
            )
        ]
        for ord in sample_orders:
            await ord.insert()
        logger.info(f"Seeded {len(sample_orders)} sample orders.")

    # 6. Seed Inventory if empty
    inv_count = await InventoryItem.count()
    if inv_count == 0:
        sample_inv = [
            InventoryItem(name="Brioche Burger Buns", category="Bakery", unit="pcs", current_stock=120, available_stock=120, min_stock_alert=25, supplier="Golden Bakery Ltd", expiry_date="2026-08-05"),
            InventoryItem(name="Portobello Mushrooms", category="Produce", unit="kg", current_stock=18.5, available_stock=18.5, min_stock_alert=5.0, supplier="Fresh Farms Organics", expiry_date="2026-07-28"),
            InventoryItem(name="Premium Pepperoni Slices", category="Meat", unit="kg", current_stock=35.0, available_stock=35.0, min_stock_alert=10.0, supplier="Apex Meat Distributors", expiry_date="2026-09-12"),
            InventoryItem(name="Ceremonial Matcha Powder", category="Dry Goods", unit="kg", current_stock=12.0, available_stock=12.0, min_stock_alert=3.0, supplier="Kyoto Tea Importers", expiry_date="2027-01-15")
        ]
        for i in sample_inv:
            await i.insert()
        logger.info(f"Seeded {len(sample_inv)} sample inventory items.")

    # 7. Seed Delivery Partners if empty
    partner_count = await DeliveryPartner.count()
    if partner_count == 0:
        sample_partners = [
            DeliveryPartner(partner_id="rider-1", full_name="John Doe", mobile_number="+1 555-0211", email="john.doe@delivo.com", status="Available", verification_status="Verified", license_verified=True, rating=4.8, total_earnings=420.50),
            DeliveryPartner(partner_id="rider-2", full_name="Alex Mercer", mobile_number="+1 555-0233", email="alex.mercer@delivo.com", status="On Delivery", verification_status="Verified", license_verified=True, rating=4.9, total_earnings=580.20),
            DeliveryPartner(partner_id="rider-3", full_name="Maria Gonzalez", mobile_number="+1 555-0245", email="maria.g@delivo.com", status="Available", verification_status="Verified", license_verified=True, rating=4.7, total_earnings=340.00)
        ]
        for dp in sample_partners:
            await dp.insert()
        logger.info(f"Seeded {len(sample_partners)} delivery partners.")

    # 8. Seed Customers if empty
    cust_count = await Customer.count()
    if cust_count == 0:
        sample_custs = [
            Customer(customer_id="cust-1", full_name="Marcus Aurelius", email="marcus@rome.org", mobile_number="+1 555-8921", status="Active", wallet_balance=25.00, reward_points=120, total_orders=14, total_spend=450.80),
            Customer(customer_id="cust-2", full_name="Bruce Wayne", email="bruce@wayne.com", mobile_number="+1 555-4920", status="Active", wallet_balance=150.00, reward_points=840, total_orders=32, total_spend=1280.00),
            Customer(customer_id="cust-3", full_name="Clark Kent", email="clark@dailyplanet.com", mobile_number="+1 555-7712", status="Active", wallet_balance=10.00, reward_points=45, total_orders=5, total_spend=112.50)
        ]
        for c in sample_custs:
            await c.insert()
        logger.info(f"Seeded {len(sample_custs)} sample customers.")

    logger.info("Seeder completed successfully.")
