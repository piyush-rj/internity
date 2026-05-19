"""Listing CRUD plus the public search feed.

Apply / list-applicants for a listing live here too because their natural URL
is `/listing/:id/...`. The non-listing-scoped application routes are in
`app/routers/application.py`.
"""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import selectinload

from app.db import models
from app.db.enums import NotificationType
from app.deps import CurrentUser, DbSession
from app.responses import Forbidden, InvalidRequest, NotFound, ok
from app.schemas.application import ApplyIn
from app.schemas.listing import ListingCreate, ListingQuery, ListingUpdate
from app.serializers import application, listing
from app.services.notification import notify_many

router = APIRouter(prefix="/listing", tags=["listing"])


def _company_of_listing(db, listing_id: str) -> tuple[str, datetime | None] | None:
    row = db.execute(
        select(models.Listing.companyId, models.Listing.closedAt).where(
            models.Listing.id == listing_id
        )
    ).first()
    return (row.companyId, row.closedAt) if row else None


def _is_member(db, company_id: str, user_id: str) -> bool:
    return db.execute(
        select(models.CompanyMember).where(
            models.CompanyMember.companyId == company_id,
            models.CompanyMember.userId == user_id,
        )
    ).scalar_one_or_none() is not None


def _normalize_skill_tags(tags: list[str]) -> list[str]:
    return [t for t in (s.strip().lower() for s in tags) if t]


# --- public feed -------------------------------------------------------------


@router.get("")
def list_listings(query: Annotated[ListingQuery, Query()], db: DbSession):
    conds = [models.Listing.closedAt.is_(None)]
    if query.type:
        conds.append(models.Listing.type == query.type)
    if query.mode:
        conds.append(models.Listing.mode == query.mode)
    if query.city:
        conds.append(models.Listing.city.ilike(f"%{query.city}%"))
    if query.q:
        q = query.q.strip()
        if q:
            conds.append(
                or_(
                    models.Listing.title.ilike(f"%{q}%"),
                    models.Listing.company.has(models.Company.name.ilike(f"%{q}%")),
                    models.Listing.skillTagsRaw.any(q.lower()),
                )
            )
    if query.stipendMin is not None:
        conds.append(models.Listing.stipendMax >= query.stipendMin)
    if query.durationMax is not None:
        conds.append(models.Listing.durationMonths <= query.durationMax)
    if query.partTime is not None:
        conds.append(models.Listing.partTime.is_(query.partTime == "true"))
    if query.skills:
        tags = _normalize_skill_tags(query.skills.split(","))
        if tags:
            conds.append(models.Listing.skillTagsRaw.overlap(tags))

    where = and_(*conds)
    total = db.execute(select(func.count()).select_from(models.Listing).where(where)).scalar_one()
    items = (
        db.execute(
            select(models.Listing)
            .where(where)
            .order_by(models.Listing.createdAt.desc())
            .offset((query.page - 1) * query.pageSize)
            .limit(query.pageSize)
            .options(selectinload(models.Listing.company))
        )
        .scalars()
        .all()
    )

    return ok(
        {
            "items": [listing(l, company_brief_only=True) for l in items],
            "page": query.page,
            "pageSize": query.pageSize,
            "total": total,
        }
    )


@router.get("/mine")
def list_mine(user: CurrentUser, db: DbSession):
    """Every listing across every company the caller belongs to."""
    company_ids = (
        db.execute(
            select(models.CompanyMember.companyId).where(models.CompanyMember.userId == user.id)
        )
        .scalars()
        .all()
    )
    if not company_ids:
        return ok({"items": []})

    rows = (
        db.execute(
            select(models.Listing)
            .where(models.Listing.companyId.in_(company_ids))
            .order_by(models.Listing.createdAt.desc())
            .options(selectinload(models.Listing.company))
        )
        .scalars()
        .all()
    )

    # Count applications per listing (one round-trip).
    counts = dict(
        db.execute(
            select(models.Application.listingId, func.count())
            .where(models.Application.listingId.in_([l.id for l in rows]))
            .group_by(models.Application.listingId)
        ).all()
    )

    items = [
        listing(
            l,
            company_brief_only=True,
            extra={"_count": {"applications": counts.get(l.id, 0)}},
        )
        for l in rows
    ]
    return ok({"items": items})


@router.get("/{id}")
def get_listing(id: str, db: DbSession):
    l = db.execute(
        select(models.Listing)
        .where(models.Listing.id == id)
        .options(
            selectinload(models.Listing.company),
            selectinload(models.Listing.skills).selectinload(models.ListingSkill.skill),
        )
    ).scalar_one_or_none()
    if l is None:
        raise NotFound()
    return ok({"listing": listing(l, include_skills=True)})


# --- writes (company members only) -------------------------------------------


@router.post("")
def create_listing(body: ListingCreate, user: CurrentUser, db: DbSession):
    if not _is_member(db, body.companyId, user.id):
        raise Forbidden("Not a member of this company")

    data = body.model_dump(exclude_unset=True)
    data["skillTagsRaw"] = _normalize_skill_tags(data.get("skillTagsRaw") or [])
    data["postedById"] = user.id
    l = models.Listing(**data)
    db.add(l)
    db.commit()
    db.refresh(l)
    db.refresh(l, attribute_names=["company"])  # for serializer
    return ok({"listing": listing(l)}, "Listing created", 201)


@router.patch("/{id}")
def update_listing(id: str, body: ListingUpdate, user: CurrentUser, db: DbSession):
    found = _company_of_listing(db, id)
    if found is None:
        raise NotFound()
    company_id, _ = found
    if not _is_member(db, company_id, user.id):
        raise Forbidden("Not a member of this company")

    data = body.model_dump(exclude_unset=True)
    if "skillTagsRaw" in data and data["skillTagsRaw"] is not None:
        data["skillTagsRaw"] = _normalize_skill_tags(data["skillTagsRaw"])

    l = db.get(models.Listing, id)
    assert l is not None  # _company_of_listing already proved it exists
    for k, v in data.items():
        setattr(l, k, v)
    db.commit()
    db.refresh(l)
    db.refresh(l, attribute_names=["company"])
    return ok({"listing": listing(l)})


def _set_closed(id: str, when: datetime | None, user_id: str, db) -> models.Listing:
    found = _company_of_listing(db, id)
    if found is None:
        raise NotFound()
    company_id, _ = found
    if not _is_member(db, company_id, user_id):
        raise Forbidden("Not a member of this company")
    l = db.get(models.Listing, id)
    assert l is not None
    l.closedAt = when
    db.commit()
    db.refresh(l)
    db.refresh(l, attribute_names=["company"])
    return l


@router.post("/{id}/close")
def close_listing(id: str, user: CurrentUser, db: DbSession):
    return ok({"listing": listing(_set_closed(id, datetime.now(timezone.utc), user.id, db))})


@router.post("/{id}/reopen")
def reopen_listing(id: str, user: CurrentUser, db: DbSession):
    return ok({"listing": listing(_set_closed(id, None, user.id, db))})


@router.delete("/{id}")
def delete_listing(id: str, user: CurrentUser, db: DbSession):
    found = _company_of_listing(db, id)
    if found is None:
        raise NotFound()
    company_id, _ = found
    if not _is_member(db, company_id, user.id):
        raise Forbidden("Not a member of this company")
    db.execute(models.Listing.__table__.delete().where(models.Listing.id == id))
    db.commit()
    return ok({"ok": True})


# --- apply & list-applicants -------------------------------------------------


@router.post("/{id}/apply")
def apply_to_listing(id: str, body: ApplyIn, user: CurrentUser, db: DbSession):
    found = _company_of_listing(db, id)
    if found is None:
        raise NotFound("Listing not found")
    company_id, closed_at = found
    if closed_at is not None:
        raise InvalidRequest("Listing is closed")
    if _is_member(db, company_id, user.id):
        raise InvalidRequest("You cannot apply to your own company")

    profile = db.execute(
        select(models.StudentProfile).where(models.StudentProfile.userId == user.id)
    ).scalar_one_or_none()
    if profile is None:
        raise InvalidRequest("Create your profile first")

    # Prisma's unique constraint on (listingId, studentId) blocks duplicate applies; the
    # Python side gets an IntegrityError which we map to a 400 for parity with the TS version.
    from sqlalchemy.exc import IntegrityError

    app = models.Application(
        listingId=id,
        studentId=user.id,
        coverLetter=body.coverLetter,
        resumeUrl=profile.resumeUrl,
    )
    db.add(app)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise InvalidRequest("You have already applied to this listing")  # noqa: B904
    db.refresh(app)
    db.refresh(app, attribute_names=["listing", "student"])

    # Open the chat channel between applicant and company immediately so
    # either side can DM the other without needing a separate "start chat"
    # step. Idempotent.
    from app.routers.chat import ensure_conversation_for_application

    ensure_conversation_for_application(db, app.id)

    member_ids = (
        db.execute(
            select(models.CompanyMember.userId).where(models.CompanyMember.companyId == company_id)
        )
        .scalars()
        .all()
    )
    notify_many(
        db,
        member_ids,
        type=NotificationType.APPLICATION_RECEIVED,
        title=f"{app.student.name} applied to {app.listing.title}",
        body=f"New applicant for your {app.listing.title} listing.",
        link=f"/home/applicants?listingId={id}",
    )

    return ok(
        {
            "application": application(
                app, include_listing=True, include_company=True, company_brief_only=True
            )
        },
        "Applied",
        201,
    )


@router.get("/{id}/applications")
def list_applications_for_listing(id: str, user: CurrentUser, db: DbSession):
    found = _company_of_listing(db, id)
    if found is None:
        raise NotFound()
    company_id, _ = found
    if not _is_member(db, company_id, user.id):
        raise Forbidden("Not a member of this company")

    rows = (
        db.execute(
            select(models.Application)
            .where(models.Application.listingId == id)
            .order_by(models.Application.appliedAt.desc())
            .options(
                selectinload(models.Application.student).selectinload(models.User.studentProfile)
            )
        )
        .scalars()
        .all()
    )
    items = [
        application(
            a,
            include_student=True,
            include_student_profile=True,
            student_profile_fields=("firstName", "lastName", "phone", "city", "bio"),
        )
        for a in rows
    ]
    return ok({"items": items})
