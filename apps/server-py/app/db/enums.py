"""Enums mirror the Prisma schema. Values match the Postgres enum labels."""

from enum import StrEnum


class UserRole(StrEnum):
    STUDENT = "STUDENT"
    EMPLOYER = "EMPLOYER"
    ADMIN = "ADMIN"


class Gender(StrEnum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"
    PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY"


class ListingType(StrEnum):
    INTERNSHIP = "INTERNSHIP"
    JOB = "JOB"


class WorkMode(StrEnum):
    REMOTE = "REMOTE"
    HYBRID = "HYBRID"
    ONSITE = "ONSITE"


class ApplicationStatus(StrEnum):
    APPLIED = "APPLIED"
    SHORTLISTED = "SHORTLISTED"
    INTERVIEW = "INTERVIEW"
    HIRED = "HIRED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"


class CompanyRole(StrEnum):
    OWNER = "OWNER"
    MEMBER = "MEMBER"


class AssetKind(StrEnum):
    RESUME = "RESUME"
    COMPANY_LOGO = "COMPANY_LOGO"
    PROFILE_IMAGE = "PROFILE_IMAGE"


class NotificationType(StrEnum):
    APPLICATION_RECEIVED = "APPLICATION_RECEIVED"
    APPLICATION_STATUS_CHANGED = "APPLICATION_STATUS_CHANGED"
    APPLICATION_WITHDRAWN = "APPLICATION_WITHDRAWN"
    LISTING_CLOSED = "LISTING_CLOSED"
    COMPANY_MEMBER_ADDED = "COMPANY_MEMBER_ADDED"
    SUBSCRIPTION_ACTIVATED = "SUBSCRIPTION_ACTIVATED"
    GENERIC = "GENERIC"


class PaymentStatus(StrEnum):
    CREATED = "CREATED"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
