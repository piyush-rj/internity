"""Student profile + its owned sub-resources (educations, experiences,
projects, skills, certifications, languages).

Skills are special because they go through a shared `Skill` table with a
normalized lowercase name and a link row (`StudentSkill`).
"""

from fastapi import APIRouter
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.db import models
from app.deps import CurrentUser, DbSession
from app.responses import InvalidRequest, NotFound, ok
from app.routers._student_subresource import _student_profile_id, mount_subresource
from app.schemas import student as schemas
from app.serializers import (
    certification,
    education,
    experience,
    language,
    project,
    skill,
    student_profile,
)

router = APIRouter(prefix="/student", tags=["student"])


# --- profile -----------------------------------------------------------------


@router.get("/me")
def get_my_profile(user: CurrentUser, db: DbSession):
    profile = db.execute(
        select(models.StudentProfile)
        .where(models.StudentProfile.userId == user.id)
        .options(
            selectinload(models.StudentProfile.educations),
            selectinload(models.StudentProfile.experiences),
            selectinload(models.StudentProfile.projects),
            selectinload(models.StudentProfile.skills).selectinload(models.StudentSkill.skill),
            selectinload(models.StudentProfile.certifications),
            selectinload(models.StudentProfile.languages),
        )
    ).scalar_one_or_none()
    if profile is None:
        raise NotFound("Profile not created")
    return ok({"profile": student_profile(profile, include_relations=True)})


@router.post("/me")
def create_my_profile(body: schemas.StudentProfileCreate, user: CurrentUser, db: DbSession):
    profile = models.StudentProfile(userId=user.id, **body.model_dump(exclude_unset=True))
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return ok({"profile": student_profile(profile)}, "Profile created", 201)


@router.patch("/me")
def update_my_profile(body: schemas.StudentProfileUpdate, user: CurrentUser, db: DbSession):
    profile = db.execute(
        select(models.StudentProfile).where(models.StudentProfile.userId == user.id)
    ).scalar_one_or_none()
    if profile is None:
        raise NotFound("Profile not created")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return ok({"profile": student_profile(profile)})


@router.get("/{user_id}")
def get_public_profile(user_id: str, user: CurrentUser, db: DbSession):
    profile = db.execute(
        select(models.StudentProfile)
        .where(models.StudentProfile.userId == user_id)
        .options(
            selectinload(models.StudentProfile.user),
            selectinload(models.StudentProfile.educations),
            selectinload(models.StudentProfile.experiences),
            selectinload(models.StudentProfile.projects),
            selectinload(models.StudentProfile.skills).selectinload(models.StudentSkill.skill),
            selectinload(models.StudentProfile.certifications),
            selectinload(models.StudentProfile.languages),
        )
    ).scalar_one_or_none()
    if profile is None:
        raise NotFound()
    return ok({"profile": student_profile(profile, include_relations=True, include_user=True)})


# --- sub-resources -----------------------------------------------------------

mount_subresource(
    router,
    path="/me/educations",
    model=models.Education,
    create_schema=schemas.EducationCreate,
    update_schema=schemas.EducationUpdate,
    serialize=education,
    response_key="education",
)
mount_subresource(
    router,
    path="/me/experiences",
    model=models.WorkExperience,
    create_schema=schemas.ExperienceCreate,
    update_schema=schemas.ExperienceUpdate,
    serialize=experience,
    response_key="experience",
)
mount_subresource(
    router,
    path="/me/projects",
    model=models.Project,
    create_schema=schemas.ProjectCreate,
    update_schema=schemas.ProjectUpdate,
    serialize=project,
    response_key="project",
)
mount_subresource(
    router,
    path="/me/certifications",
    model=models.Certification,
    create_schema=schemas.CertificationCreate,
    update_schema=schemas.CertificationUpdate,
    serialize=certification,
    response_key="certification",
)
mount_subresource(
    router,
    path="/me/languages",
    model=models.Language,
    create_schema=schemas.LanguageCreate,
    update_schema=schemas.LanguageUpdate,
    serialize=language,
    response_key="language",
)


# --- skills (custom because they share a global `Skill` table) ---------------


@router.post("/me/skills")
def add_skill(body: schemas.SkillAdd, user: CurrentUser, db: DbSession):
    student_id = _student_profile_id(db, user.id)
    if student_id is None:
        raise InvalidRequest("Create your profile first")

    normalized = body.name.strip().lower()
    sk = db.execute(select(models.Skill).where(models.Skill.name == normalized)).scalar_one_or_none()
    if sk is None:
        sk = models.Skill(name=normalized)
        db.add(sk)
        db.flush()

    link = db.execute(
        select(models.StudentSkill).where(
            models.StudentSkill.studentId == student_id,
            models.StudentSkill.skillId == sk.id,
        )
    ).scalar_one_or_none()
    if link is None:
        link = models.StudentSkill(studentId=student_id, skillId=sk.id, level=body.level)
        db.add(link)
    else:
        link.level = body.level
    db.commit()
    db.refresh(link)

    return ok(
        {
            "skill": skill(sk),
            "link": {"studentId": link.studentId, "skillId": link.skillId, "level": link.level},
        }
    )


@router.delete("/me/skills/{skill_id}")
def remove_skill(skill_id: str, user: CurrentUser, db: DbSession):
    student_id = _student_profile_id(db, user.id)
    if student_id is None:
        raise NotFound()
    db.execute(
        delete(models.StudentSkill).where(
            models.StudentSkill.studentId == student_id,
            models.StudentSkill.skillId == skill_id,
        )
    )
    db.commit()
    return ok({"ok": True})
