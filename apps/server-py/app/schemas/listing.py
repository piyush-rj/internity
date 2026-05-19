from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.db.enums import ListingType, WorkMode


class ListingCreate(BaseModel):
    companyId: str
    type: ListingType
    title: str = Field(min_length=1)
    mode: WorkMode
    city: str | None = None
    description: str = Field(min_length=1)
    responsibilities: list[str] = Field(default_factory=list)
    perks: list[str] = Field(default_factory=list)
    preferences: list[str] = Field(default_factory=list)
    skillTagsRaw: list[str] = Field(default_factory=list)
    stipendMin: int | None = None
    stipendMax: int | None = None
    durationMonths: int | None = None
    startDate: datetime | None = None
    applyBy: datetime | None = None
    openings: int | None = None
    partTime: bool | None = None


class ListingUpdate(BaseModel):
    type: ListingType | None = None
    title: str | None = Field(default=None, min_length=1)
    mode: WorkMode | None = None
    city: str | None = None
    description: str | None = Field(default=None, min_length=1)
    responsibilities: list[str] | None = None
    perks: list[str] | None = None
    preferences: list[str] | None = None
    skillTagsRaw: list[str] | None = None
    stipendMin: int | None = None
    stipendMax: int | None = None
    durationMonths: int | None = None
    startDate: datetime | None = None
    applyBy: datetime | None = None
    openings: int | None = None
    partTime: bool | None = None


class ListingQuery(BaseModel):
    type: ListingType | None = None
    q: str | None = None
    city: str | None = None
    mode: WorkMode | None = None
    skills: str | None = None
    stipendMin: int | None = None
    durationMax: int | None = None
    partTime: Literal["true", "false"] | None = None
    page: int = Field(default=1, ge=1)
    pageSize: int = Field(default=20, ge=1, le=50)
