"""ORM -> dict serializers.

Each function turns a SQLAlchemy model instance (or list) into a plain dict.
Relations are only included when explicitly listed — callers must
`selectinload` or `joinedload` them first, otherwise the relation attribute
will trigger a lazy query (or AttributeError on a detached instance).

The output shape matches the JSON the original TypeScript backend produced
with Prisma so existing frontend code keeps working.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import inspect

from app.db import models


def _columns(obj: Any) -> dict[str, Any]:
    mapper = inspect(obj).mapper
    return {col.key: getattr(obj, col.key) for col in mapper.column_attrs}


# --- user / auth -------------------------------------------------------------


def user_basic(u: models.User) -> dict[str, Any]:
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "image": u.image,
    }


def user_full(u: models.User) -> dict[str, Any]:
    return _columns(u)


# --- student -----------------------------------------------------------------


def education(e: models.Education) -> dict[str, Any]:
    return _columns(e)


def experience(e: models.WorkExperience) -> dict[str, Any]:
    return _columns(e)


def project(p: models.Project) -> dict[str, Any]:
    return _columns(p)


def skill(s: models.Skill) -> dict[str, Any]:
    return _columns(s)


def student_skill(link: models.StudentSkill) -> dict[str, Any]:
    out = _columns(link)
    out["skill"] = skill(link.skill)
    return out


def certification(c: models.Certification) -> dict[str, Any]:
    return _columns(c)


def language(l: models.Language) -> dict[str, Any]:
    return _columns(l)


def student_profile(
    p: models.StudentProfile,
    *,
    include_relations: bool = False,
    include_user: bool = False,
) -> dict[str, Any]:
    out = _columns(p)
    if include_relations:
        out["educations"] = [education(x) for x in p.educations]
        out["experiences"] = [experience(x) for x in p.experiences]
        out["projects"] = [project(x) for x in p.projects]
        out["skills"] = [student_skill(x) for x in p.skills]
        out["certifications"] = [certification(x) for x in p.certifications]
        out["languages"] = [language(x) for x in p.languages]
    if include_user:
        out["user"] = user_basic(p.user)
    return out


# --- employer ----------------------------------------------------------------


def employer_profile(p: models.EmployerProfile) -> dict[str, Any]:
    return _columns(p)


# --- company -----------------------------------------------------------------


def company(c: models.Company) -> dict[str, Any]:
    return _columns(c)


def company_brief(c: models.Company) -> dict[str, Any]:
    return {"id": c.id, "name": c.name, "slug": c.slug, "logoUrl": c.logoUrl}


def company_member(m: models.CompanyMember, *, include_user: bool = False) -> dict[str, Any]:
    out = _columns(m)
    if include_user:
        out["user"] = user_basic(m.user)
    return out


# --- listings & applications -------------------------------------------------


def listing(
    l: models.Listing,
    *,
    company_brief_only: bool = False,
    include_company: bool = True,
    include_skills: bool = False,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    out = _columns(l)
    if include_company:
        out["company"] = company_brief(l.company) if company_brief_only else company(l.company)
    if include_skills:
        out["skills"] = [
            {"listingId": link.listingId, "skillId": link.skillId, "skill": skill(link.skill)}
            for link in l.skills
        ]
    if extra:
        out.update(extra)
    return out


def application(
    a: models.Application,
    *,
    include_listing: bool = False,
    include_company: bool = False,
    company_brief_only: bool = False,
    include_student: bool = False,
    include_student_profile: bool = False,
    student_profile_fields: tuple[str, ...] | None = None,
) -> dict[str, Any]:
    out = _columns(a)
    if include_listing:
        out["listing"] = listing(
            a.listing,
            include_company=include_company,
            company_brief_only=company_brief_only,
        )
    if include_student:
        student = user_basic(a.student)
        if include_student_profile and a.student.studentProfile is not None:
            sp_dict = _columns(a.student.studentProfile)
            if student_profile_fields:
                sp_dict = {k: sp_dict.get(k) for k in student_profile_fields}
            student["studentProfile"] = sp_dict
        elif include_student_profile:
            student["studentProfile"] = None
        out["student"] = student
    return out


def saved_listing(s: models.SavedListing) -> dict[str, Any]:
    out = _columns(s)
    out["listing"] = listing(s.listing, company_brief_only=True)
    return out


# --- assets & payments & notifications --------------------------------------


def asset(a: models.Asset) -> dict[str, Any]:
    return _columns(a)


def payment(p: models.Payment) -> dict[str, Any]:
    return _columns(p)


def notification(n: models.Notification) -> dict[str, Any]:
    return _columns(n)
