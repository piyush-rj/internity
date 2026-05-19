"""CustomWS — typed wrapper around Starlette's WebSocket.

Browsers can't set Authorization headers on a WebSocket handshake, so we
authenticate in-band: the first message after `accept()` must be of type
`auth` carrying a Supabase JWT. The wrapper:

  - blocks send/recv of chat traffic until auth completes,
  - exposes a strongly-typed `send`/`recv` interface keyed off our shared
    ServerMessage / ClientMessage discriminated unions,
  - holds the authenticated user identity for downstream handlers.

Wrap, don't subclass. Composition gives us a tight surface that prevents
callers from reaching into the raw WebSocket (and the typing of
`receive_json` etc.) by accident.
"""

import logging
from dataclasses import dataclass

from fastapi import WebSocket
from pydantic import TypeAdapter, ValidationError
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from starlette.websockets import WebSocketDisconnect, WebSocketState

from app.core import jwt as jwt_service
from app.db.enums import UserRole
from app.db.models import User
from app.schemas.chat import (
    CAuth,
    ClientMessage,
    SConnected,
    SError,
    ServerMessage,
)

logger = logging.getLogger(__name__)


# Custom close codes — must be in 4000-4999 range per RFC 6455.
WS_CLOSE_UNAUTHORIZED = 4401
WS_CLOSE_TIMEOUT = 4408
WS_CLOSE_INVALID_PAYLOAD = 4400

_AUTH_TIMEOUT_SECONDS = 10.0

_client_message_adapter: TypeAdapter[ClientMessage] = TypeAdapter(ClientMessage)


@dataclass
class WSUser:
    """Authenticated identity bound to a CustomWS instance."""

    id: str  # public.User.id (cuid)
    name: str | None
    email: str | None
    role: UserRole


class AuthFailed(Exception):
    """Raised when the auth handshake doesn't yield a valid user."""


class CustomWS:
    """Authenticated, typed wrapper around a Starlette WebSocket.

    Lifecycle:
        ws = CustomWS(websocket)
        await ws.accept()
        await ws.authenticate(db)
        while True:
            msg = await ws.recv()
            ...
    """

    def __init__(self, websocket: WebSocket) -> None:
        self._ws = websocket
        self._user: WSUser | None = None

    # ------------------------------------------------------------------ auth

    @property
    def user(self) -> WSUser:
        if self._user is None:
            raise RuntimeError(
                "CustomWS.user accessed before authenticate() succeeded"
            )
        return self._user

    @property
    def is_authenticated(self) -> bool:
        return self._user is not None

    async def accept(self) -> None:
        await self._ws.accept()

    async def authenticate(self, db: Session) -> WSUser:
        """Block until the client sends a valid `auth` message; close otherwise.

        Returns the authenticated user. On failure, closes the socket with
        a 4401 and raises AuthFailed — the route handler can treat that as
        a clean exit.
        """
        try:
            raw = await self._receive_json_with_timeout(_AUTH_TIMEOUT_SECONDS)
        except TimeoutError:
            await self._close_with_error(
                WS_CLOSE_TIMEOUT, "auth_timeout", "Auth message not received in time."
            )
            raise AuthFailed("auth timed out")
        except WebSocketDisconnect:
            raise AuthFailed("client disconnected before auth")

        try:
            msg = _client_message_adapter.validate_python(raw)
        except ValidationError as exc:
            await self._close_with_error(
                WS_CLOSE_INVALID_PAYLOAD,
                "invalid_payload",
                f"Malformed auth message: {exc.errors()[0]['msg']}",
            )
            raise AuthFailed("malformed auth payload")

        if not isinstance(msg, CAuth):
            await self._close_with_error(
                WS_CLOSE_UNAUTHORIZED,
                "unauthorized",
                "First message must be of type 'auth'.",
            )
            raise AuthFailed("first message was not 'auth'")

        claims = jwt_service.verify(msg.token)
        if claims is None:
            await self._close_with_error(
                WS_CLOSE_UNAUTHORIZED, "unauthorized", "Invalid token."
            )
            raise AuthFailed("invalid token")

        supabase_user_id = claims.get("sub")
        email = claims.get("email")
        phone = claims.get("phone")
        if not supabase_user_id:
            await self._close_with_error(
                WS_CLOSE_UNAUTHORIZED, "unauthorized", "Token missing subject."
            )
            raise AuthFailed("token missing sub")

        user = db.execute(
            select(User).where(User.supabaseUserId == supabase_user_id)
        ).scalar_one_or_none()

        if user is None and (email or phone):
            conditions = []
            if email:
                conditions.append(User.email == email)
            if phone:
                conditions.append(User.phone == phone)
            user = db.execute(select(User).where(or_(*conditions))).scalar_one_or_none()
            if user is not None and user.supabaseUserId is None:
                user.supabaseUserId = supabase_user_id
                db.commit()
                db.refresh(user)

        if user is None:
            await self._close_with_error(
                WS_CLOSE_UNAUTHORIZED, "unauthorized", "No matching user."
            )
            raise AuthFailed("user not found")

        self._user = WSUser(
            id=user.id, name=user.name, email=user.email, role=user.role
        )
        await self.send(SConnected(userId=user.id))
        return self._user

    # ------------------------------------------------------------------ io

    async def send(self, msg: ServerMessage) -> None:
        """Send a typed server message, dropping silently if the socket closed."""
        if self._ws.client_state != WebSocketState.CONNECTED:
            return
        try:
            await self._ws.send_json(_dump(msg))
        except WebSocketDisconnect:
            return

    async def recv(self) -> ClientMessage:
        """Receive and validate the next client message.

        Raises ValidationError on malformed payloads — the caller should
        translate that into an SError reply and continue, rather than
        tearing down the connection.
        """
        raw = await self._ws.receive_json()
        return _client_message_adapter.validate_python(raw)

    async def close(self, code: int = 1000, reason: str = "") -> None:
        if self._ws.client_state == WebSocketState.CONNECTED:
            await self._ws.close(code=code, reason=reason)

    # ------------------------------------------------------------------ helpers

    async def _receive_json_with_timeout(self, timeout: float) -> dict:
        import asyncio

        return await asyncio.wait_for(self._ws.receive_json(), timeout=timeout)

    async def _close_with_error(
        self,
        close_code: int,
        error_code: str,
        message: str,
    ) -> None:
        await self.send(SError(code=error_code, message=message))  # type: ignore[arg-type]
        await self.close(code=close_code, reason=message[:120])


def _dump(msg: ServerMessage) -> dict:
    """Serialize a ServerMessage to a JSON-ready dict.

    `mode="json"` ensures `datetime` becomes an ISO-8601 string — matching
    what the TS client expects to parse.
    """
    return msg.model_dump(mode="json")
