"""Best-effort notification writes.

Callers are usually in the middle of a successful mutation and we don't want a
notification failure to roll back the real work, so both helpers swallow
exceptions after logging them.
"""

from __future__ import annotations

import logging
from collections.abc import Iterable

from sqlalchemy.orm import Session

from app.db.enums import NotificationType
from app.db.models import Notification

log = logging.getLogger(__name__)


def notify(
    db: Session,
    *,
    user_id: str,
    type: NotificationType,
    title: str,
    body: str | None = None,
    link: str | None = None,
) -> None:
    try:
        db.add(Notification(userId=user_id, type=type, title=title, body=body, link=link))
        db.commit()
    except Exception:  # noqa: BLE001 - best-effort by design
        log.exception("notify failed")
        db.rollback()


def notify_many(
    db: Session,
    user_ids: Iterable[str],
    *,
    type: NotificationType,
    title: str,
    body: str | None = None,
    link: str | None = None,
) -> None:
    ids = list(user_ids)
    if not ids:
        return
    try:
        db.add_all(
            Notification(userId=uid, type=type, title=title, body=body, link=link)
            for uid in ids
        )
        db.commit()
    except Exception:  # noqa: BLE001
        log.exception("notify_many failed")
        db.rollback()
