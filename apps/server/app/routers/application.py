"""Non-listing-scoped application endpoints: list mine, view, withdraw,
update status. The actual apply / list-applicants live in `listing.py`
because their URLs are scoped to `/listing/:id/...`.
"""

from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.db import models
from app.db.enums import ApplicationStatus, NotificationType
from app.deps import CurrentUser, DbSession
from app.responses import Forbidden, NotFound, ok
from app.schemas.application import StatusIn
from app.serializers import application
from app.services.notification import notify

router = APIRouter(prefix="/application", tags=["application"])


_STATUS_LABEL = {
    ApplicationStatus.APPLIED: "Applied",
    ApplicationStatus.SHORTLISTED: "Shortlisted",
    ApplicationStatus.INTERVIEW: "Interview",
    ApplicationStatus.HIRED: "Hired",
    ApplicationStatus.REJECTED: "Rejected",
    ApplicationStatus.WITHDRAWN: "Withdrawn",
}


@router.get("/mine")
def list_mine(user: CurrentUser, db: DbSession):
    rows = (
        db.execute(
            select(models.Application)
            .where(models.Application.studentId == user.id)
            .order_by(models.Application.appliedAt.desc())
            .options(
                selectinload(models.Application.listing).selectinload(models.Listing.company)
            )
        )
        .scalars()
        .all()
    )
    return ok(
        {
            "items": [
                application(a, include_listing=True, include_company=True, company_brief_only=True)
                for a in rows
            ]
        }
    )


@router.get("/{id}")
def get_application(id: str, user: CurrentUser, db: DbSession):
    a = db.execute(
        select(models.Application)
        .where(models.Application.id == id)
        .options(
            selectinload(models.Application.listing).selectinload(models.Listing.company),
            selectinload(models.Application.student).selectinload(models.User.studentProfile),
        )
    ).scalar_one_or_none()
    if a is None:
        raise NotFound()

    is_applicant = a.studentId == user.id
    is_member = False
    if not is_applicant:
        is_member = db.execute(
            select(models.CompanyMember).where(
                models.CompanyMember.companyId == a.listing.companyId,
                models.CompanyMember.userId == user.id,
            )
        ).scalar_one_or_none() is not None
    if not is_applicant and not is_member:
        raise Forbidden("Not allowed")

    return ok(
        {
            "application": application(
                a,
                include_listing=True,
                include_company=True,
                include_student=True,
                include_student_profile=True,
            )
        }
    )


@router.delete("/{id}")
def withdraw(id: str, user: CurrentUser, db: DbSession):
    """Soft-action: mark as WITHDRAWN. The ownership filter ensures a caller
    can't withdraw another student's application.
    """
    result = db.execute(
        update(models.Application)
        .where(models.Application.id == id, models.Application.studentId == user.id)
        .values(status=ApplicationStatus.WITHDRAWN, statusUpdatedAt=datetime.now(timezone.utc))
    )
    if result.rowcount == 0:
        raise NotFound()
    db.commit()
    return ok({"ok": True})


@router.patch("/{id}/status")
def update_status(id: str, body: StatusIn, user: CurrentUser, db: DbSession):
    a = db.execute(
        select(models.Application)
        .where(models.Application.id == id)
        .options(selectinload(models.Application.listing).selectinload(models.Listing.company))
    ).scalar_one_or_none()
    if a is None:
        raise NotFound()

    is_member = db.execute(
        select(models.CompanyMember).where(
            models.CompanyMember.companyId == a.listing.companyId,
            models.CompanyMember.userId == user.id,
        )
    ).scalar_one_or_none() is not None
    if not is_member:
        raise Forbidden("Not a member of this company")

    a.status = ApplicationStatus(body.status)
    a.statusUpdatedAt = datetime.now(timezone.utc)
    db.commit()
    db.refresh(a)
    db.refresh(a, attribute_names=["listing"])

    label = _STATUS_LABEL[a.status]
    notify(
        db,
        user_id=a.studentId,
        type=NotificationType.APPLICATION_STATUS_CHANGED,
        title=f"{a.listing.company.name} marked you as {label}",
        body=f"{a.listing.title} · {label}",
        link="/home/applications",
    )

    return ok({"application": application(a, include_listing=True, include_company=True)})
