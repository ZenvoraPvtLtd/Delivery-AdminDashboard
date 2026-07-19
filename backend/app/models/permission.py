from beanie import Document, Indexed
from typing import Optional, Annotated
from bson import ObjectId

class Permission(Document):
    module: Annotated[str, Indexed]
    permission_name: Annotated[str, Indexed(unique=True)]
    create: bool = False
    read: bool = False
    update: bool = False
    delete: bool = False
    approve: bool = False
    export: bool = False

    class Settings:
        name = "permissions"
