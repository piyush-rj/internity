from typing import Literal

from pydantic import BaseModel, Field

from app.db.enums import UserRole


class SetRoleIn(BaseModel):
    role: Literal[UserRole.STUDENT, UserRole.EMPLOYER]


class UpdateMeIn(BaseModel):
    """Partial update for the calling user's identity fields.

    Used by the phone-signup onboarding step to capture display name
    (first + last name concatenated by the client).
    """

    name: str | None = Field(default=None, min_length=1, max_length=200)
