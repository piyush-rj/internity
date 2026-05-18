"""Company CRUD plus membership management.

`require_company_member` is applied via FastAPI dependencies on routes that
need it — the helper reads the `id` path param and looks up the caller in
`CompanyMember`.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.db import models
from app.db.enums import CompanyRole
from app.deps import CurrentUser, DbSession, require_company_member
from app.responses import InvalidRequest, NotFound, ok
from app.schemas.company import CompanyCreate, CompanyMemberAdd, CompanyMemberUpdate, CompanyUpdate
from app.serializers import company as ser_company
from app.serializers import company_member, listing

router = APIRouter(prefix="/company", tags=["company"])


@router.post("")
def create(body: CompanyCreate, user: CurrentUser, db: DbSession):
    """Caller becomes the OWNER member of the new company in one transaction."""
    data = body.model_dump(exclude_unset=True)
    # HttpUrl objects need to be coerced to strings for storage
    for k in ("logoUrl", "website"):
        if data.get(k) is not None:
            data[k] = str(data[k])

    c = models.Company(**data)
    db.add(c)
    db.flush()  # need c.id before adding the membership
    db.add(models.CompanyMember(companyId=c.id, userId=user.id, role=CompanyRole.OWNER))
    db.commit()
    db.refresh(c)

    members = (
        db.execute(select(models.CompanyMember).where(models.CompanyMember.companyId == c.id))
        .scalars()
        .all()
    )
    return ok(
        {"company": {**ser_company(c), "members": [company_member(m) for m in members]}},
        "Company created",
        201,
    )


@router.get("/{slug}")
def get_by_slug(slug: str, db: DbSession):
    """Public: returns the company plus up to 20 live listings."""
    c = db.execute(select(models.Company).where(models.Company.slug == slug)).scalar_one_or_none()
    if c is None:
        raise NotFound()

    live_listings = (
        db.execute(
            select(models.Listing)
            .where(models.Listing.companyId == c.id, models.Listing.closedAt.is_(None))
            .order_by(models.Listing.createdAt.desc())
            .limit(20)
            .options(selectinload(models.Listing.company))
        )
        .scalars()
        .all()
    )
    return ok({"company": {**ser_company(c), "listings": [listing(l) for l in live_listings]}})


@router.patch("/{id}", dependencies=[Depends(require_company_member(owner_only=True))])
def update(id: str, body: CompanyUpdate, db: DbSession):
    c = db.get(models.Company, id)
    if c is None:
        raise NotFound()
    data = body.model_dump(exclude_unset=True)
    for k in ("logoUrl", "website"):
        if data.get(k) is not None:
            data[k] = str(data[k])
    for k, v in data.items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return ok({"company": ser_company(c)})


# --- members -----------------------------------------------------------------


@router.get("/{id}/members", dependencies=[Depends(require_company_member())])
def list_members(id: str, db: DbSession):
    rows = (
        db.execute(
            select(models.CompanyMember)
            .where(models.CompanyMember.companyId == id)
            .order_by(models.CompanyMember.joinedAt.asc())
            .options(selectinload(models.CompanyMember.user))
        )
        .scalars()
        .all()
    )
    return ok({"members": [company_member(m, include_user=True) for m in rows]})


@router.post("/{id}/members", dependencies=[Depends(require_company_member(owner_only=True))])
def add_member(id: str, body: CompanyMemberAdd, db: DbSession):
    target = db.execute(select(models.User).where(models.User.email == body.email)).scalar_one_or_none()
    if target is None:
        raise NotFound("No user with that email")
    member = models.CompanyMember(
        companyId=id, userId=target.id, role=body.role or CompanyRole.MEMBER
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return ok({"member": company_member(member)}, "Member added", 201)


@router.patch(
    "/{id}/members/{userId}",
    dependencies=[Depends(require_company_member(owner_only=True))],
)
def update_member_role(id: str, userId: str, body: CompanyMemberUpdate, db: DbSession):
    target = db.get(models.CompanyMember, (id, userId))
    if target is None:
        raise NotFound()

    if body.role == CompanyRole.MEMBER and target.role == CompanyRole.OWNER:
        owner_count = db.execute(
            select(func.count())
            .select_from(models.CompanyMember)
            .where(
                models.CompanyMember.companyId == id,
                models.CompanyMember.role == CompanyRole.OWNER,
            )
        ).scalar_one()
        if owner_count <= 1:
            raise InvalidRequest("Cannot demote the last owner")

    target.role = body.role
    db.commit()
    db.refresh(target)
    return ok({"member": company_member(target)})


@router.delete(
    "/{id}/members/{userId}",
    dependencies=[Depends(require_company_member(owner_only=True))],
)
def remove_member(id: str, userId: str, db: DbSession):
    target = db.get(models.CompanyMember, (id, userId))
    if target is None:
        raise NotFound()

    if target.role == CompanyRole.OWNER:
        owner_count = db.execute(
            select(func.count())
            .select_from(models.CompanyMember)
            .where(
                models.CompanyMember.companyId == id,
                models.CompanyMember.role == CompanyRole.OWNER,
            )
        ).scalar_one()
        if owner_count <= 1:
            raise InvalidRequest("Cannot remove the last owner")

    db.delete(target)
    db.commit()
    return ok({"ok": True})
