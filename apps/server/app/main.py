from __future__ import annotations

import logging

from fastapi import APIRouter, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.responses import (
    ApiError,
    InvalidRequest,
    api_error_handler,
    api_error_response,
)
from app.routers import (
    application,
    auth,
    company,
    employer,
    listing,
    notification,
    payment,
    saved,
    skill,
    student,
    upload,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s | %(message)s")
log = logging.getLogger("server")

app = FastAPI(title="Internshala clone API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(ApiError, api_error_handler)


@app.exception_handler(RequestValidationError)
async def _validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return api_error_response(InvalidRequest("Invalid data"))


@app.exception_handler(Exception)
async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
    log.exception("unhandled exception", exc_info=exc)
    return api_error_response(ApiError())


v1 = APIRouter(prefix="/api/v1")


@v1.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


for r in (
    auth.router,
    student.router,
    employer.router,
    company.router,
    listing.router,
    application.router,
    saved.router,
    upload.router,
    skill.router,
    notification.router,
    payment.router,
):
    v1.include_router(r)

app.include_router(v1)
