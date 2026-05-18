from pydantic import BaseModel, Field


class EmployerProfileCreate(BaseModel):
    firstName: str = Field(min_length=1)
    lastName: str | None = None
    phone: str | None = None
    jobTitle: str | None = None


class EmployerProfileUpdate(BaseModel):
    firstName: str | None = Field(default=None, min_length=1)
    lastName: str | None = None
    phone: str | None = None
    jobTitle: str | None = None
