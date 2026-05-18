from typing import Literal

from pydantic import BaseModel, EmailStr, HttpUrl

from app.db.enums import UserRole


class SignInIn(BaseModel):
    name: str
    email: EmailStr
    image: HttpUrl | None = None
    googleId: str


class SetRoleIn(BaseModel):
    role: Literal[UserRole.STUDENT, UserRole.EMPLOYER]
