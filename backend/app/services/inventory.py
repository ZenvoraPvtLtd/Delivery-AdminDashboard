from typing import List, Optional, Tuple, Dict, Any
from app.repositories.inventory import InventoryRepository, get_inventory_repository
from app.models.inventory import InventoryItem, InventoryTransaction, PurchaseOrder
from app.schemas.inventory import StockAdjustRequest, PurchaseOrderCreate, OrderDeductionRequest
from fastapi import HTTPException
from datetime import datetime

class InventoryService:
    def __init__(self, repository: InventoryRepository):
        self.repository = repository

    async def list_items(self, skip: int, limit: int, search: Optional[str], category: Optional[str]) -> Tuple[List[InventoryItem], int]:
        return await self.repository.list_items(skip, limit, search, category)

    async def adjust_stock(self, item_id: str, data: StockAdjustRequest, request_info: dict) -> InventoryItem:
        item = await self.repository.get_item(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
            
        old_stock = item.current_stock
        new_stock = old_stock + data.amount
        
        if new_stock < 0:
            raise HTTPException(status_code=400, detail="Cannot reduce stock below 0")
            
        item.current_stock = new_stock
        item.available_stock = new_stock - item.reserved_stock
        item.updated_at = datetime.utcnow()
        updated_item = await self.repository.update_item(item)
        
        tx_type = "Stock In" if data.amount > 0 else "Stock Out"
        
        tx = InventoryTransaction(
            item_id=item_id,
            transaction_type=tx_type,
            quantity=abs(data.amount),
            notes="Manual adjustment via UI",
            created_by=request_info.get("performed_by", "System")
        )
        await self.repository.create_transaction(tx)
        
        return updated_item

    async def issue_purchase_order(self, data: PurchaseOrderCreate, request_info: dict) -> PurchaseOrder:
        # Get item to determine unit
        item = await self.repository.get_item_by_name(data.item)
        unit = item.unit if item else "units"
        
        po = PurchaseOrder(
            item_name=data.item,
            quantity=data.qty,
            unit=unit,
            supplier_name=data.supplier,
            status="Sent",
            date=datetime.utcnow().strftime("%Y-%m-%d")
        )
        return await self.repository.create_purchase_order(po)

    async def list_purchase_orders(self) -> List[PurchaseOrder]:
        return await self.repository.list_purchase_orders()
        
    async def deduct_for_order(self, data: OrderDeductionRequest, request_info: dict):
        # Hooks for Orders module to deduct stock automatically
        for req_item in data.items:
            item_id = req_item.get("item_id")
            qty = req_item.get("quantity", 0)
            
            item = await self.repository.get_item(item_id)
            if item:
                if item.available_stock >= qty:
                    item.current_stock -= qty
                    item.available_stock -= qty
                    item.updated_at = datetime.utcnow()
                    await self.repository.update_item(item)
                    
                    tx = InventoryTransaction(
                        item_id=item_id,
                        transaction_type="Stock Out",
                        quantity=qty,
                        reference_id=data.order_id,
                        notes=f"Order Fulfillment {data.order_id}",
                        created_by="System"
                    )
                    await self.repository.create_transaction(tx)
        return {"success": True, "message": "Inventory deducted successfully"}

def get_inventory_service() -> InventoryService:
    return InventoryService(get_inventory_repository())
