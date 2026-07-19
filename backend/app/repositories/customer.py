from typing import List, Optional, Dict, Any, Tuple
from app.models.customer import Customer, CustomerAddress, CustomerWalletTransaction, CustomerNote, CustomerActivityLog
from beanie.operators import RegEx, In, Or
from pymongo.errors import DuplicateKeyError
import math

class CustomerRepository:
    
    async def create_customer(self, customer: Customer) -> Customer:
        try:
            return await customer.insert()
        except DuplicateKeyError as e:
            raise ValueError("Customer with this email or phone already exists")

    async def get_customer(self, customer_id: str) -> Optional[Customer]:
        return await Customer.get(customer_id)
        
    async def get_customer_by_email(self, email: str) -> Optional[Customer]:
        return await Customer.find_one(Customer.email == email)

    async def get_customer_by_mobile(self, mobile: str) -> Optional[Customer]:
        return await Customer.find_one(Customer.mobile_number == mobile)

    async def list_customers(self, 
                             skip: int = 0, 
                             limit: int = 20, 
                             search: Optional[str] = None, 
                             status: Optional[str] = None, 
                             customer_type: Optional[str] = None,
                             sort_by: str = "-created_at") -> Tuple[List[Customer], int]:
        
        query = {}
        if search:
            regex = RegEx(pattern=search, options="i")
            query["$or"] = [
                {"full_name": regex},
                {"email": regex},
                {"mobile_number": regex},
                {"customer_id": regex}
            ]
            
        if status:
            query["status"] = status
            
        if customer_type:
            query["customer_type"] = customer_type

        find_query = Customer.find(query)
        total = await find_query.count()
        
        # Sort formatting: "-created_at" -> ("created_at", -1)
        sort_field = sort_by.lstrip("-")
        sort_order = -1 if sort_by.startswith("-") else 1
        
        customers = await find_query.sort((sort_field, sort_order)).skip(skip).limit(limit).to_list()
        return customers, total

    async def update_customer(self, customer: Customer) -> Customer:
        return await customer.save()

    async def delete_customer(self, customer: Customer) -> None:
        await customer.delete()

    # Address Operations
    async def add_address(self, address: CustomerAddress) -> CustomerAddress:
        if address.default_address:
            # Unset existing defaults for this customer
            await CustomerAddress.find(CustomerAddress.customer_id == address.customer_id).update({"$set": {"default_address": False}})
        return await address.insert()

    async def get_addresses(self, customer_id: str) -> List[CustomerAddress]:
        return await CustomerAddress.find(CustomerAddress.customer_id == customer_id).sort("-created_at").to_list()

    async def get_address(self, address_id: str) -> Optional[CustomerAddress]:
        return await CustomerAddress.get(address_id)

    async def update_address(self, address: CustomerAddress) -> CustomerAddress:
        if address.default_address:
            # Unset existing defaults
            await CustomerAddress.find(
                CustomerAddress.customer_id == address.customer_id, 
                CustomerAddress.id != address.id
            ).update({"$set": {"default_address": False}})
        return await address.save()

    async def delete_address(self, address: CustomerAddress) -> None:
        await address.delete()

    # Wallet Operations
    async def add_wallet_transaction(self, transaction: CustomerWalletTransaction) -> CustomerWalletTransaction:
        return await transaction.insert()

    async def get_wallet_history(self, customer_id: str) -> List[CustomerWalletTransaction]:
        return await CustomerWalletTransaction.find(CustomerWalletTransaction.customer_id == customer_id).sort("-created_at").to_list()

    # Note Operations
    async def add_note(self, note: CustomerNote) -> CustomerNote:
        return await note.insert()
        
    async def get_notes(self, customer_id: str) -> List[CustomerNote]:
        return await CustomerNote.find(CustomerNote.customer_id == customer_id).sort("-created_at").to_list()

    # Activity Operations
    async def add_activity_log(self, log: CustomerActivityLog) -> CustomerActivityLog:
        return await log.insert()

    async def get_activity_logs(self, customer_id: str) -> List[CustomerActivityLog]:
        return await CustomerActivityLog.find(CustomerActivityLog.customer_id == customer_id).sort("-created_at").to_list()

    async def get_summary_stats(self) -> Dict[str, Any]:
        total = await Customer.find_all().count()
        active = await Customer.find(Customer.status == "Active").count()
        blocked = await Customer.find(Customer.status == "Blocked").count()
        return {
            "total_customers": total,
            "active_customers": active,
            "blocked_customers": blocked
        }

def get_customer_repository() -> CustomerRepository:
    return CustomerRepository()
