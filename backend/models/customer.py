from pydantic import Field
from typing import List, Optional
from models.base import MongoBaseModel

class Customer(MongoBaseModel):
    id: str
    name: str
    phone: str
    email: str
    password: str
    walletBalance: float = Field(default=0.0)
    rewardPoints: int = Field(default=0)
    status: str = Field(default="Active")  # Active, Blocked
    addresses: List[str] = Field(default_factory=list)
    favoriteItems: List[str] = Field(default_factory=list)
