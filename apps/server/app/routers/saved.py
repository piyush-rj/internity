from fastapi import APIRouter
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.db import models
from app.deps import CurrentUser, DbSession
from app.responses import ok
from app.serializers import saved_listing

router = APIRouter(prefix="/saved", tags=["saved"])


@router.get("")
def list_saved(user: CurrentUser, db: DbSession):
    rows = (
        db.execute(
            select(models.SavedListing)
            .where(models.SavedListing.userId == user.id)
            .order_by(models.SavedListing.createdAt.desc())
            .options(
                selectinload(models.SavedListing.listing).selectinload(models.Listing.company)
            )
        )
        .scalars()
        .all()
    )
    return ok({"items": [saved_listing(s) for s in rows]})


@router.post("/{listing_id}")
def save(listing_id: str, user: CurrentUser, db: DbSession):
    """Idempotent: re-saving the same listing is a no-op."""
    existing = db.get(models.SavedListing, (user.id, listing_id))
    if existing is None:
        existing = models.SavedListing(userId=user.id, listingId=listing_id)
        db.add(existing)
        db.commit()
        db.refresh(existing)
    return ok(
        {
            "saved": {
                "userId": existing.userId,
                "listingId": existing.listingId,
                "createdAt": existing.createdAt,
            }
        }
    )


@router.delete("/{listing_id}")
def unsave(listing_id: str, user: CurrentUser, db: DbSession):
    db.execute(
        delete(models.SavedListing).where(
            models.SavedListing.userId == user.id,
            models.SavedListing.listingId == listing_id,
        )
    )
    db.commit()
    return ok({"ok": True})
