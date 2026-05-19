from pydantic import BaseModel, EmailStr, Field, HttpUrl

from app.db.enums import CompanyRole


class CompanyCreate(BaseModel):
    name: str = Field(min_length=1)
    slug: str = Field(pattern=r"^[a-z0-9-]+$")
    logoUrl: HttpUrl | None = None
    website: HttpUrl | None = None
    about: str | None = None
    industry: str | None = None
    size: str | None = None
    city: str | None = None


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    logoUrl: HttpUrl | None = None
    website: HttpUrl | None = None
    about: str | None = None
    industry: str | None = None
    size: str | None = None
    city: str | None = None


class CompanyMemberAdd(BaseModel):
    email: EmailStr
    role: CompanyRole | None = None


class CompanyMemberUpdate(BaseModel):
    role: CompanyRole
