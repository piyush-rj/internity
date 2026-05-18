from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.db import models
from app.deps import DbSession
from app.responses import ok
from app.schemas.skill import AutocompleteQuery
from app.serializers import skill

router = APIRouter(prefix="/skill", tags=["skill"])


@router.get("")
def autocomplete(query: Annotated[AutocompleteQuery, Query()], db: DbSession):
    """Skill names are stored lowercased, so we match the prefix the same way."""
    needle = query.q.strip().lower()
    rows = (
        db.execute(
            select(models.Skill)
            .where(models.Skill.name.startswith(needle))
            .order_by(models.Skill.name.asc())
            .limit(10)
        )
        .scalars()
        .all()
    )
    return ok({"items": [skill(s) for s in rows]})
