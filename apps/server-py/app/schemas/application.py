from typing import Literal

from pydantic import BaseModel, Field

from app.db.enums import ApplicationStatus


class ApplyIn(BaseModel):
    coverLetter: str = Field(min_length=1, max_length=1200)


class StatusIn(BaseModel):
    # WITHDRAWN is initiated by the student via the withdraw endpoint, not by the company.
    status: Literal[
        ApplicationStatus.APPLIED,
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.HIRED,
        ApplicationStatus.REJECTED,
    ]
