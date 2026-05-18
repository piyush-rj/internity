"""Helper for the five `StudentProfile`-owned sub-resources.

Educations, experiences, projects, certifications, and languages all follow
the same shape: caller must have a profile; rows are scoped to that profile
on read and write; updates and deletes use an ownership filter so a caller
can't touch another student's rows even with a guessed id.

This factory keeps the five identical 60-line modules from existing.
"""

from collections.abc import Callable
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.db.models import StudentProfile
from app.deps import CurrentUser, DbSession
from app.responses import InvalidRequest, NotFound, ok


def _student_profile_id(db: Session, user_id: str) -> str | None:
    return db.execute(
        select(StudentProfile.id).where(StudentProfile.userId == user_id)
    ).scalar_one_or_none()


def mount_subresource(
    router: APIRouter,
    *,
    path: str,
    model: type,
    create_schema: type[BaseModel],
    update_schema: type[BaseModel],
    serialize: Callable[[Any], dict[str, Any]],
    response_key: str,
):
    """Mount POST `path`, PATCH `path/{id}`, DELETE `path/{id}` on `router`.

    `model` is the SQLAlchemy class (e.g. Education). It must have an `id`
    column and a `studentId` column.
    """

    def _add(body: create_schema, user: CurrentUser, db: DbSession):  # type: ignore[valid-type]
        student_id = _student_profile_id(db, user.id)
        if student_id is None:
            raise InvalidRequest("Create your profile first")
        row = model(studentId=student_id, **body.model_dump(exclude_unset=True))
        db.add(row)
        db.commit()
        db.refresh(row)
        return ok({response_key: serialize(row)}, "Created", 201)

    def _update(row_id: str, body: update_schema, user: CurrentUser, db: DbSession):  # type: ignore[valid-type]
        student_id = _student_profile_id(db, user.id)
        if student_id is None:
            raise NotFound()
        data = body.model_dump(exclude_unset=True)
        if not data:
            return ok({"ok": True})
        result = db.execute(
            update(model)
            .where(model.id == row_id, model.studentId == student_id)
            .values(**data)
        )
        if result.rowcount == 0:
            raise NotFound()
        db.commit()
        return ok({"ok": True})

    def _remove(row_id: str, user: CurrentUser, db: DbSession):
        student_id = _student_profile_id(db, user.id)
        if student_id is None:
            raise NotFound()
        result = db.execute(
            delete(model).where(model.id == row_id, model.studentId == student_id)
        )
        if result.rowcount == 0:
            raise NotFound()
        db.commit()
        return ok({"ok": True})

    # Distinct endpoint names per resource keep FastAPI's OpenAPI operationIds unique.
    _add.__name__ = f"add_{response_key}"
    _update.__name__ = f"update_{response_key}"
    _remove.__name__ = f"remove_{response_key}"

    router.add_api_route(path, _add, methods=["POST"])
    router.add_api_route(f"{path}/{{row_id}}", _update, methods=["PATCH"])
    router.add_api_route(f"{path}/{{row_id}}", _remove, methods=["DELETE"])

    return _add, _update, _remove
