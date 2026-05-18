from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db import models
from app.deps import CurrentUser, DbSession
from app.responses import NotFound, ok
from app.schemas.employer import EmployerProfileCreate, EmployerProfileUpdate
from app.serializers import company, company_member, employer_profile

router = APIRouter(prefix="/employer", tags=["employer"])


@router.get("/me")
def get_my_profile(user: CurrentUser, db: DbSession):
    profile = db.execute(
        select(models.EmployerProfile).where(models.EmployerProfile.userId == user.id)
    ).scalar_one_or_none()

    memberships = db.execute(
        select(models.CompanyMember)
        .where(models.CompanyMember.userId == user.id)
        .options(selectinload(models.CompanyMember.company))
    ).scalars().all()

    return ok(
        {
            "profile": employer_profile(profile) if profile else None,
            "memberships": [
                {**company_member(m), "company": company(m.company)} for m in memberships
            ],
        }
    )


@router.post("/me")
def create_my_profile(body: EmployerProfileCreate, user: CurrentUser, db: DbSession):
    profile = models.EmployerProfile(userId=user.id, **body.model_dump(exclude_unset=True))
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return ok({"profile": employer_profile(profile)}, "Profile created", 201)


@router.patch("/me")
def update_my_profile(body: EmployerProfileUpdate, user: CurrentUser, db: DbSession):
    profile = db.execute(
        select(models.EmployerProfile).where(models.EmployerProfile.userId == user.id)
    ).scalar_one_or_none()
    if profile is None:
        raise NotFound()
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(profile, k, v)
    db.commit()
    db.refresh(profile)
    return ok({"profile": employer_profile(profile)})
