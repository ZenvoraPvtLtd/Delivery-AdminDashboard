from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.user import User
from app.models.audit import AuditLog

class DashboardRepository:
    """
    Repository for dashboard analytics.
    Uses direct motor aggregations for collections that do not have active ODM models yet.
    """
    
    @staticmethod
    def _get_db() -> AsyncIOMotorDatabase:
        # Helper to get the active motor database from an existing Beanie model
        return User.get_motor_collection().database

    async def get_total_revenue(self) -> float:
        db = self._get_db()
        pipeline = [
            {"$match": {"status": {"$ne": "Cancelled"}}},
            {"$group": {"_id": None, "total": {"$sum": "$total"}}}
        ]
        cursor = db.orders.aggregate(pipeline)
        result = await cursor.to_list(length=1)
        return result[0]["total"] if result else 0.0

    async def get_active_dispatch_queue(self) -> int:
        db = self._get_db()
        count = await db.orders.count_documents({
            "status": {"$in": ["Pending", "Preparing", "Ready", "Out for Delivery"]}
        })
        return count

    async def get_low_inventory_count(self) -> int:
        db = self._get_db()
        # Fallback to 0 if products collection is empty or doesn't exist
        pipeline = [
            {"$match": {"$expr": {"$lt": ["$stock", "$minStockAlert"]}}},
            {"$count": "count"}
        ]
        cursor = db.products.aggregate(pipeline)
        result = await cursor.to_list(length=1)
        return result[0]["count"] if result else 0

    async def get_open_tickets_count(self) -> int:
        db = self._get_db()
        count = await db.tickets.count_documents({"status": "Open"})
        return count

    async def get_orders_by_status(self, statuses: List[str]) -> int:
        db = self._get_db()
        return await db.orders.count_documents({"status": {"$in": statuses}})

    async def get_chart_data(self, timeframe: str) -> List[Dict[str, Any]]:
        db = self._get_db()
        # timeframe could be 'daily', 'weekly', 'monthly'
        # For simplicity, returning mock structure if collection is empty,
        # but performing actual grouping if data exists.
        
        # Example aggregation for weekly (last 7 days)
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=7)
        
        pipeline = [
            {"$match": {"created_at": {"$gte": start_date}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "sales": {"$sum": "$total"},
                "orders": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        cursor = db.orders.aggregate(pipeline)
        results = await cursor.to_list(length=7)
        
        # If no real data, we return empty so the service can mock/handle it
        return results

    async def get_recent_orders(self, limit: int = 5) -> List[Dict[str, Any]]:
        db = self._get_db()
        cursor = db.orders.find().sort("created_at", -1).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_recent_activities(self, limit: int = 10) -> List[AuditLog]:
        return await AuditLog.find().sort(-AuditLog.timestamp).limit(limit).to_list()
