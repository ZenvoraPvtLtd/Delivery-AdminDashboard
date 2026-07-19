from typing import List, Optional, Tuple
from app.models.inventory import InventoryItem, InventoryTransaction, PurchaseOrder
from beanie.operators import RegEx

class InventoryRepository:
    
    async def list_items(self, 
                         skip: int = 0, 
                         limit: int = 20, 
                         search: Optional[str] = None, 
                         category: Optional[str] = None) -> Tuple[List[InventoryItem], int]:
        
        query = {}
        if search:
            regex = RegEx(pattern=search, options="i")
            query["$or"] = [
                {"name": regex},
                {"supplier": regex}
            ]
            
        if category and category != "All":
            query["category"] = category

        find_query = InventoryItem.find(query)
        total = await find_query.count()
        
        items = await find_query.sort("name").skip(skip).limit(limit).to_list()
        return items, total

    async def get_item(self, item_id: str) -> Optional[InventoryItem]:
        return await InventoryItem.get(item_id)
        
    async def get_item_by_name(self, name: str) -> Optional[InventoryItem]:
        return await InventoryItem.find_one(InventoryItem.name == name)

    async def update_item(self, item: InventoryItem) -> InventoryItem:
        return await item.save()
        
    async def create_transaction(self, tx: InventoryTransaction) -> InventoryTransaction:
        return await tx.insert()

    async def create_purchase_order(self, po: PurchaseOrder) -> PurchaseOrder:
        return await po.insert()

    async def list_purchase_orders(self) -> List[PurchaseOrder]:
        return await PurchaseOrder.find_all().sort("-created_at").to_list()

def get_inventory_repository() -> InventoryRepository:
    return InventoryRepository()
