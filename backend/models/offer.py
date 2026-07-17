from pydantic import Field
from models.base import MongoBaseModel

class OfferBanner(MongoBaseModel):
    id: str
    title: str
    image: str
    status: str = Field(default="Active")  # Active, Inactive
    type: str = Field(default="Homepage")  # Homepage, Offer
    schedule: str
