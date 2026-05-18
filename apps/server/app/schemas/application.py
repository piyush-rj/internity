from typing import Literal

from pydantic import BaseModel

from app.db.enums import ApplicationStatus


class ApplyIn(BaseModel):
    coverLetter: str | None = None


class StatusIn(BaseModel):
    # WITHDRAWN is initiated by the student via the withdraw endpoint, not by the company.
    status: Literal[
        ApplicationStatus.APPLIED,
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.HIRED,
        ApplicationStatus.REJECTED,
    ]
