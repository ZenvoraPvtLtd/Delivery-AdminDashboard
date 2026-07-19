from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from loguru import logger
from pymongo.errors import PyMongoError, DuplicateKeyError
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

class BaseAPIException(Exception):
    def __init__(self, message: str, status_code: int = 400, details: dict | None = None):
        self.message = message
        self.status_code = status_code
        self.details = details

def setup_exception_handlers(app: FastAPI):
    @app.exception_handler(BaseAPIException)
    async def custom_exception_handler(request: Request, exc: BaseAPIException):
        logger.error(f"Error {exc.status_code}: {exc.message} - details: {exc.details}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "error": {"code": exc.status_code, "message": exc.message, "details": exc.details}},
        )
        
    @app.exception_handler(DuplicateKeyError)
    async def duplicate_key_exception_handler(request: Request, exc: DuplicateKeyError):
        logger.error(f"Database Duplicate Key Error: {exc}")
        return JSONResponse(
            status_code=409,
            content={"success": False, "error": {"code": 409, "message": "Resource already exists. Duplicate key error."}},
        )
        
    @app.exception_handler(PyMongoError)
    async def mongo_exception_handler(request: Request, exc: PyMongoError):
        logger.error(f"Database Error: {exc}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": {"code": 500, "message": "Internal database error occurred."}},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.error(f"Validation Error: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content={"success": False, "error": {"code": 422, "message": "Validation Error", "details": exc.errors()}},
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.error(f"HTTP Error {exc.status_code}: {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "error": {"code": exc.status_code, "message": exc.detail}},
        )
    
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled exception: {exc}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": {"code": 500, "message": "Internal Server Error"}},
        )
