"""
Global Exception Classes and Handlers for Krishi Saathi AI.
Ensures standardized JSON response formats across all endpoints.
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


class KrishiSaathiException(Exception):
    """Base exception for application-specific errors."""
    def __init__(self, message: str, status_code: int = 400, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


async def krishi_exception_handler(request: Request, exc: KrishiSaathiException):
    """Formats custom domain exceptions into standard JSON envelope."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "message": exc.message,
                "status_code": exc.status_code,
                "details": exc.details
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Formats Pydantic validation errors nicely for frontend consumption."""
    errors = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err["loc"])
        errors.append({
            "field": field,
            "message": err["msg"],
            "type": err["type"]
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "message": "Input validation failed. Please check the submitted fields.",
                "status_code": 422,
                "details": errors
            }
        }
    )


async def general_http_exception_handler(request: Request, exc: HTTPException):
    """Formats standard FastAPI HTTPExceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "message": exc.detail,
                "status_code": exc.status_code,
                "details": {}
            }
        }
    )
