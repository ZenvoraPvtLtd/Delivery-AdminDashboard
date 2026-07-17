from pydantic import Field
from models.base import MongoBaseModel

class Outlet(MongoBaseModel):
    id: str
    name: str
    address: str
    manager: str
    phone: str
    status: str = Field(default="Open")  # Open, Closed
    revenue: float = Field(default=0.0)
    ordersCount: int = Field(default=0)
    taxNumber: str
    hours: str
    latitude: float
    longitude: float
