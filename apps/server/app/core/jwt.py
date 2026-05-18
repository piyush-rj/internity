"""JWT issue/verify.

Matches the original TS service: HS256, no expiry, payload carries the basic
user identity fields needed by middleware downstream.
"""

from typing import TypedDict

import jwt

from app.config import settings
from app.db.enums import UserRole


class JWTPayload(TypedDict):
    id: str
    name: str
    email: str
    image: str | None
    role: UserRole


_ALGORITHM = "HS256"


def issue(payload: JWTPayload) -> str:
    return jwt.encode(dict(payload), settings.SERVER_JWT_SECRET, algorithm=_ALGORITHM)


def verify(token: str) -> JWTPayload | None:
    try:
        decoded = jwt.decode(token, settings.SERVER_JWT_SECRET, algorithms=[_ALGORITHM])
    except jwt.PyJWTError:
        return None
    if not isinstance(decoded, dict):
        return None
    return decoded  # type: ignore[return-value]
