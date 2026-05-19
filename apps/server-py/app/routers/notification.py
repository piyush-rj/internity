from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import func, select, update

from app.db import models
from app.deps import CurrentUser, DbSession
from app.responses import NotFound, ok
from app.serializers import notification

router = APIRouter(prefix="/notification", tags=["notification"])

_DEFAULT_LIMIT = 20
_MAX_LIMIT = 50


@router.get("")
def list_mine(user: CurrentUser, db: DbSession, limit: int | None = None):
    take = _DEFAULT_LIMIT if not limit or limit <= 0 else min(limit, _MAX_LIMIT)
    items = (
        db.execute(
            select(models.Notification)
            .where(models.Notification.userId == user.id)
            .order_by(models.Notification.createdAt.desc())
            .limit(take)
        )
        .scalars()
        .all()
    )
    unread = db.execute(
        select(func.count())
        .select_from(models.Notification)
        .where(models.Notification.userId == user.id, models.Notification.readAt.is_(None))
    ).scalar_one()
    return ok({"items": [notification(n) for n in items], "unread": unread})


@router.patch("/{id}/read")
def mark_read(id: str, user: CurrentUser, db: DbSession):
    n = db.get(models.Notification, id)
    if n is None or n.userId != user.id:
        raise NotFound()
    if n.readAt is None:
        n.readAt = datetime.now(timezone.utc)
        db.commit()
        db.refresh(n)
    return ok({"notification": notification(n)})


@router.post("/read-all")
def mark_all_read(user: CurrentUser, db: DbSession):
    result = db.execute(
        update(models.Notification)
        .where(models.Notification.userId == user.id, models.Notification.readAt.is_(None))
        .values(readAt=datetime.now(timezone.utc))
    )
    db.commit()
    return ok({"updated": result.rowcount})
