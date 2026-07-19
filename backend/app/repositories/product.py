from typing import List, Optional, Tuple
from app.models.product import Product
from beanie.operators import RegEx
import uuid
import re

class ProductRepository:
    
    async def create_product(self, product: Product) -> Product:
        return await product.insert()

    async def get_product(self, product_id: str) -> Optional[Product]:
        return await Product.get(product_id)

    async def list_products(self, 
                            skip: int = 0, 
                            limit: int = 20, 
                            search: Optional[str] = None, 
                            category: Optional[str] = None,
                            veg_filter: Optional[str] = None,
                            menu_schedule: Optional[str] = None,
                            sort_by: str = "-created_at") -> Tuple[List[Product], int]:
        
        query = {}
        if search:
            regex = RegEx(pattern=search, options="i")
            query["$or"] = [
                {"name": regex},
                {"description": regex},
                {"sku": regex}
            ]
            
        if category and category != "All":
            query["category"] = category
            
        if veg_filter and veg_filter != "All":
            query["is_veg"] = True if veg_filter == "Veg" else False
            
        if menu_schedule and menu_schedule != "All":
            if menu_schedule == "Breakfast":
                query["category"] = {"$in": ["Breakfast", "Beverages"]}
            elif menu_schedule == "Lunch":
                query["category"] = {"$in": ["Fast Food", "Italian", "Salads", "Beverages"]}
            elif menu_schedule == "Dinner":
                query["category"] = {"$in": ["Fast Food", "Italian", "Salads", "Snacks", "Beverages"]}
            elif menu_schedule == "Late Night":
                query["category"] = {"$in": ["Fast Food", "Snacks", "Beverages"]}

        find_query = Product.find(query)
        total = await find_query.count()
        
        sort_field = sort_by.lstrip("-")
        sort_order = -1 if sort_by.startswith("-") else 1
        
        products = await find_query.sort((sort_field, sort_order)).skip(skip).limit(limit).to_list()
        return products, total

    async def update_product(self, product: Product) -> Product:
        return await product.save()

    async def delete_product(self, product: Product):
        await product.delete()

def get_product_repository() -> ProductRepository:
    return ProductRepository()
