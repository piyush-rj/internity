"""Supabase JWT verification.

We do not issue tokens here — Supabase Auth (GoTrue) does that. This module
only verifies tokens minted by Supabase for our project.

Supabase projects ship two signing modes:

  * Legacy HS256 — symmetric, shared secret in `SUPABASE_JWT_SECRET`.
  * JWT Signing Keys — asymmetric (RS256 / ES256), public keys served from
    the project's JWKS endpoint at `/auth/v1/.well-known/jwks.json`.

We inspect the unverified header to pick the right key for each token, so
both modes work side by side during the rolling cutover Supabase performs
when a project enables Signing Keys.
"""

from typing import Any, TypedDict, cast

import jwt
from jwt import PyJWKClient

from app.config import settings

# Supabase always sets aud="authenticated" on user tokens; anything else
# (e.g. anon, service_role) is a backend token we want to reject up front.
_AUDIENCE = "authenticated"

_jwks_client = PyJWKClient(
    f"{str(settings.SUPABASE_URL).rstrip('/')}/auth/v1/.well-known/jwks.json",
    cache_keys=True,
    lifespan=3600,
)


class SupabaseClaims(TypedDict, total=False):
    sub: str  # auth.users.id (uuid)
    email: str | None
    phone: str | None
    role: str  # Supabase role: "authenticated"
    aud: str
    exp: int
    user_metadata: dict[str, Any]
    app_metadata: dict[str, Any]


def verify(token: str) -> SupabaseClaims | None:
    """Validate a Supabase JWT and return its claims, or None if invalid."""
    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError:
        return None

    alg = header.get("alg")
    if not isinstance(alg, str):
        return None

    try:
        if alg == "HS256":
            decoded = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience=_AUDIENCE,
            )
        elif alg in ("RS256", "ES256"):
            signing_key = _jwks_client.get_signing_key_from_jwt(token).key
            decoded = jwt.decode(
                token,
                signing_key,
                algorithms=[alg],
                audience=_AUDIENCE,
            )
        else:
            return None
    except jwt.PyJWTError:
        return None

    if not isinstance(decoded, dict):
        return None
    return cast(SupabaseClaims, decoded)
