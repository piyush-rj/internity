"""In-memory registry of live chat sockets.

One user can have multiple open sockets (multiple tabs, mobile + desktop).
Broadcasts iterate every socket for every target user and tolerate per-socket
failures so one dead connection doesn't sink the rest.

Fine for single-process dev. For horizontal scaling, swap the in-memory dict
for a Redis pub/sub fan-out — the public interface stays the same.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Iterable

from app.core.ws import CustomWS
from app.schemas.chat import ServerMessage

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        # userId -> set of live CustomWS instances
        self._sockets: dict[str, set[CustomWS]] = {}
        self._lock = asyncio.Lock()

    async def register(self, user_id: str, ws: CustomWS) -> None:
        async with self._lock:
            self._sockets.setdefault(user_id, set()).add(ws)

    async def unregister(self, user_id: str, ws: CustomWS) -> None:
        async with self._lock:
            bucket = self._sockets.get(user_id)
            if not bucket:
                return
            bucket.discard(ws)
            if not bucket:
                self._sockets.pop(user_id, None)

    async def send_to_user(self, user_id: str, msg: ServerMessage) -> None:
        for ws in self._sockets_for(user_id):
            await ws.send(msg)

    async def send_to_users(self, user_ids: Iterable[str], msg: ServerMessage) -> None:
        seen: set[str] = set()
        for uid in user_ids:
            if uid in seen:
                continue
            seen.add(uid)
            await self.send_to_user(uid, msg)

    def _sockets_for(self, user_id: str) -> list[CustomWS]:
        # Snapshot under no lock — fine because send() is tolerant of a
        # closed socket and broadcasting through a stale ref is harmless.
        bucket = self._sockets.get(user_id)
        return list(bucket) if bucket else []


# Process-global singleton. Keep imports cheap by lazily importing this
# from route handlers rather than constructing on import elsewhere.
manager = ConnectionManager()
