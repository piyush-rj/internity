"""Response envelope and error helpers.

Every successful response is wrapped in
    {"success": true, "data": ..., "message": "...", "metadata": {"timestamp": ...}}

Errors raised as `ApiError` (or its subclasses) are converted to
    {"success": false, "error": {"code": ..., "message": ...}, "metadata": {...}}
by the exception handler registered in `app.main`.
"""

from datetime import datetime, timezone
from typing import Any

from fastapi import Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def _timestamp() -> str:
    # Match the JS `new Date().toISOString()` shape ("2025-01-01T12:00:00.000Z").
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def ok(
    data: Any,
    message: str = "Request succeeded",
    status_code: int = status.HTTP_200_OK,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "data": jsonable_encoder(data),
            "message": message,
            "metadata": {"timestamp": _timestamp()},
        },
    )


class ApiError(Exception):
    """Domain error that maps onto the response envelope.

    Subclasses set sensible default codes and HTTP statuses.
    """

    code: str = "INTERNAL_SERVER_ERROR"
    status_code: int = 500
    default_message: str = "Internal server error"

    def __init__(self, message: str | None = None, status_code: int | None = None):
        self.message = message or self.default_message
        if status_code is not None:
            self.status_code = status_code
        super().__init__(self.message)


class Unauthorized(ApiError):
    code = "UNAUTHORIZED"
    status_code = 401
    default_message = "You are not authorized"


class Forbidden(Unauthorized):
    status_code = 403


class InvalidRequest(ApiError):
    code = "INVALID_REQUEST"
    status_code = 400
    default_message = "Invalid data"


class NotFound(ApiError):
    code = "NOT_FOUND"
    status_code = 404
    default_message = "Data not found"


def api_error_response(err: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=err.status_code,
        content={
            "success": False,
            "error": {"code": err.code, "message": err.message},
            "metadata": {"timestamp": _timestamp()},
        },
    )


async def api_error_handler(_: Request, exc: ApiError) -> JSONResponse:  # noqa: D401
    return api_error_response(exc)
