from fastapi import APIRouter, Depends, Query, Request
from typing import Any, List
from app.services.customer import CustomerService, get_customer_service
from app.schemas.customer import (
    CustomerCreate, CustomerUpdate, CustomerResponse, PaginatedCustomerResponse,
    AddressCreate, AddressUpdate, AddressResponse,
    WalletAdjustRequest, WalletTransactionResponse,
    NoteCreate, NoteResponse, ActivityLogResponse
)
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

def get_request_info(request: Request, current_user: User):
    return {
        "ip": request.client.host if request.client else "unknown",
        "performed_by": current_user.email
    }

# =====================
# CUSTOMER PROFILE CRUD
# =====================

@router.post("/", response_model=CustomerResponse, summary="Create Customer")
async def create_customer(
    data: CustomerCreate, 
    request: Request,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    customer = await service.create_customer(data, get_request_info(request, current_user))
    # Beanie id mapping to string
    res = customer.model_dump()
    res["id"] = str(customer.id)
    return res

@router.get("/", response_model=PaginatedCustomerResponse, summary="List Customers")
async def list_customers(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = None,
    status: str = None,
    customer_type: str = None,
    sort: str = "-created_at",
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    skip = (page - 1) * size
    customers, total = await service.list_customers(skip, size, search, status, customer_type, sort)
    
    data = []
    for c in customers:
        cdict = c.model_dump()
        cdict["id"] = str(c.id)
        data.append(cdict)
        
    return PaginatedCustomerResponse(
        success=True,
        message="Customers retrieved successfully",
        data=data,
        total=total,
        page=page,
        size=size
    )

@router.get("/summary", summary="Get Customers Summary")
async def get_customer_summary(
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    data = await service.get_summary()
    return {"success": True, "data": data}

@router.get("/{customer_id}", response_model=CustomerResponse, summary="Get Customer")
async def get_customer(
    customer_id: str,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    customer = await service.get_customer(customer_id)
    res = customer.model_dump()
    res["id"] = str(customer.id)
    return res

@router.put("/{customer_id}", response_model=CustomerResponse, summary="Update Customer")
async def update_customer(
    customer_id: str,
    data: CustomerUpdate,
    request: Request,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    customer = await service.update_customer(customer_id, data, get_request_info(request, current_user))
    res = customer.model_dump()
    res["id"] = str(customer.id)
    return res

@router.delete("/{customer_id}", summary="Delete Customer")
async def delete_customer(
    customer_id: str,
    request: Request,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    await service.delete_customer(customer_id, get_request_info(request, current_user))
    return {"success": True, "message": "Customer deleted successfully"}

@router.put("/{customer_id}/block", response_model=CustomerResponse, summary="Block Customer")
async def block_customer(
    customer_id: str,
    request: Request,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    customer = await service.block_customer(customer_id, get_request_info(request, current_user))
    res = customer.model_dump()
    res["id"] = str(customer.id)
    return res

@router.put("/{customer_id}/unblock", response_model=CustomerResponse, summary="Unblock Customer")
async def unblock_customer(
    customer_id: str,
    request: Request,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    customer = await service.unblock_customer(customer_id, get_request_info(request, current_user))
    res = customer.model_dump()
    res["id"] = str(customer.id)
    return res

# =====================
# ADDRESSES
# =====================

@router.get("/{customer_id}/addresses", response_model=List[AddressResponse], summary="Get Customer Addresses")
async def get_addresses(
    customer_id: str,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    addresses = await service.get_addresses(customer_id)
    return [{"id": str(a.id), **a.model_dump()} for a in addresses]

@router.post("/{customer_id}/addresses", response_model=AddressResponse, summary="Add Customer Address")
async def add_address(
    customer_id: str,
    data: AddressCreate,
    request: Request,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    address = await service.add_address(customer_id, data, get_request_info(request, current_user))
    return {"id": str(address.id), **address.model_dump()}

@router.put("/{customer_id}/addresses/{address_id}", response_model=AddressResponse, summary="Update Customer Address")
async def update_address(
    customer_id: str,
    address_id: str,
    data: AddressUpdate,
    request: Request,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    address = await service.update_address(customer_id, address_id, data, get_request_info(request, current_user))
    return {"id": str(address.id), **address.model_dump()}

@router.delete("/{customer_id}/addresses/{address_id}", summary="Delete Customer Address")
async def delete_address(
    customer_id: str,
    address_id: str,
    request: Request,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    await service.delete_address(customer_id, address_id, get_request_info(request, current_user))
    return {"success": True, "message": "Address deleted"}

# =====================
# WALLETS
# =====================

@router.post("/{customer_id}/wallet/adjust", response_model=WalletTransactionResponse, summary="Adjust Wallet Balance")
async def adjust_wallet(
    customer_id: str,
    data: WalletAdjustRequest,
    request: Request,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    transaction = await service.adjust_wallet(customer_id, data, get_request_info(request, current_user))
    return {"id": str(transaction.id), **transaction.model_dump()}

@router.get("/{customer_id}/wallet/history", response_model=List[WalletTransactionResponse], summary="Get Wallet History")
async def get_wallet_history(
    customer_id: str,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    history = await service.get_wallet_history(customer_id)
    return [{"id": str(h.id), **h.model_dump()} for h in history]

# =====================
# NOTES & ACTIVITIES
# =====================

@router.post("/{customer_id}/notes", response_model=NoteResponse, summary="Add Note")
async def add_note(
    customer_id: str,
    data: NoteCreate,
    request: Request,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    note = await service.add_note(customer_id, data, get_request_info(request, current_user))
    return {"id": str(note.id), **note.model_dump()}

@router.get("/{customer_id}/notes", response_model=List[NoteResponse], summary="Get Notes")
async def get_notes(
    customer_id: str,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    notes = await service.get_notes(customer_id)
    return [{"id": str(n.id), **n.model_dump()} for n in notes]

@router.get("/{customer_id}/activities", response_model=List[ActivityLogResponse], summary="Get Activities")
async def get_activities(
    customer_id: str,
    service: CustomerService = Depends(get_customer_service),
    current_user: User = Depends(get_current_user)
) -> Any:
    activities = await service.get_activity_logs(customer_id)
    return [{"id": str(a.id), **a.model_dump()} for a in activities]
