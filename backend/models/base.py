from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class MongoBaseModel(BaseModel):
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    is_deleted: bool = Field(default=False)
