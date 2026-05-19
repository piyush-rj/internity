from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl

from app.db.enums import Gender


class StudentProfileCreate(BaseModel):
    firstName: str = Field(min_length=1)
    lastName: str | None = None
    phone: str | None = None
    city: str | None = None
    dob: datetime | None = None
    gender: Gender | None = None
    bio: str | None = None


class StudentProfileUpdate(BaseModel):
    firstName: str | None = Field(default=None, min_length=1)
    lastName: str | None = None
    phone: str | None = None
    city: str | None = None
    dob: datetime | None = None
    gender: Gender | None = None
    bio: str | None = None


class EducationCreate(BaseModel):
    institute: str = Field(min_length=1)
    degree: str = Field(min_length=1)
    fieldOfStudy: str | None = None
    startYear: int
    endYear: int | None = None
    grade: str | None = None
    current: bool | None = None


class EducationUpdate(BaseModel):
    institute: str | None = Field(default=None, min_length=1)
    degree: str | None = Field(default=None, min_length=1)
    fieldOfStudy: str | None = None
    startYear: int | None = None
    endYear: int | None = None
    grade: str | None = None
    current: bool | None = None


class ExperienceCreate(BaseModel):
    company: str = Field(min_length=1)
    title: str = Field(min_length=1)
    location: str | None = None
    startDate: datetime
    endDate: datetime | None = None
    current: bool | None = None
    description: str | None = None


class ExperienceUpdate(BaseModel):
    company: str | None = Field(default=None, min_length=1)
    title: str | None = Field(default=None, min_length=1)
    location: str | None = None
    startDate: datetime | None = None
    endDate: datetime | None = None
    current: bool | None = None
    description: str | None = None


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1)
    link: HttpUrl | None = None
    description: str | None = None
    startDate: datetime | None = None
    endDate: datetime | None = None


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    link: HttpUrl | None = None
    description: str | None = None
    startDate: datetime | None = None
    endDate: datetime | None = None


class SkillAdd(BaseModel):
    name: str = Field(min_length=1)
    level: int | None = Field(default=None, ge=1, le=5)


class CertificationCreate(BaseModel):
    name: str = Field(min_length=1)
    issuer: str | None = None
    issueDate: datetime | None = None
    credentialUrl: HttpUrl | None = None


class CertificationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    issuer: str | None = None
    issueDate: datetime | None = None
    credentialUrl: HttpUrl | None = None


class LanguageCreate(BaseModel):
    name: str = Field(min_length=1)
    proficiency: int | None = Field(default=None, ge=1, le=5)


class LanguageUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    proficiency: int | None = Field(default=None, ge=1, le=5)
