from typing import List, Optional, Tuple, Dict, Any
from app.repositories.product import ProductRepository, get_product_repository
from app.models.product import Product
from app.schemas.product import ProductCreate
from fastapi import HTTPException
from datetime import datetime
import uuid

class ProductService:
    def __init__(self, repository: ProductRepository):
        self.repository = repository

    async def create_product(self, data: ProductCreate, request_info: dict) -> Product:
        # Generate SKU
        sku = f"{data.category[:3].upper()}-{uuid.uuid4().hex[:6].upper()}"
        
        product = Product(
            name=data.name,
            sku=sku,
            category=data.category,
            subcategory=data.subcategory,
            selling_price=data.price,
            mrp=data.price + data.discount if data.discount else data.price,
            discount=data.discount,
            availability=data.availability,
            preparation_time=data.preparation_time,
            is_veg=data.is_veg,
            is_best_seller=data.is_best_seller,
            images=[data.image] if data.image else [],
            outlet_ids=data.outlet_ids,
            gst=data.gst_rate,
            description=data.description,
            created_by=request_info.get("performed_by", "System")
        )
        return await self.repository.create_product(product)

    async def get_product(self, product_id: str) -> Product:
        product = await self.repository.get_product(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    async def list_products(self, skip: int, limit: int, search: Optional[str], category: Optional[str], veg_filter: Optional[str], menu_schedule: Optional[str], sort: str) -> Tuple[List[Product], int]:
        return await self.repository.list_products(skip, limit, search, category, veg_filter, menu_schedule, sort)

    async def update_product(self, product_id: str, data: ProductCreate, request_info: dict) -> Product:
        product = await self.get_product(product_id)
        
        product.name = data.name
        product.category = data.category
        product.subcategory = data.subcategory
        product.selling_price = data.price
        product.discount = data.discount
        product.availability = data.availability
        product.preparation_time = data.preparation_time
        product.is_veg = data.is_veg
        product.is_best_seller = data.is_best_seller
        if data.image:
            product.images = [data.image]
        product.outlet_ids = data.outlet_ids
        product.gst = data.gst_rate
        product.description = data.description
        product.updated_at = datetime.utcnow()
        product.updated_by = request_info.get("performed_by", "System")
        
        return await self.repository.update_product(product)

    async def toggle_availability(self, product_id: str, availability: bool, request_info: dict) -> Product:
        product = await self.get_product(product_id)
        product.availability = availability
        product.updated_at = datetime.utcnow()
        return await self.repository.update_product(product)

    async def delete_product(self, product_id: str, request_info: dict):
        product = await self.get_product(product_id)
        await self.repository.delete_product(product)

def get_product_service() -> ProductService:
    return ProductService(get_product_repository())
