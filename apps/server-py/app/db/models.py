"""SQLAlchemy 2.0 ORM models.

The schema is owned by Prisma (see `packages/database/prisma/schema.prisma`).
These classes mirror that schema so Python can read and write the same tables.
When the Prisma schema changes, update the mirrors here too.
"""

from __future__ import annotations

from datetime import datetime

import cuid
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.db.enums import (
    ApplicationStatus,
    AssetKind,
    CompanyRole,
    Gender,
    ListingType,
    NotificationType,
    PaymentStatus,
    UserRole,
    WorkMode,
)


def _cuid() -> str:
    return cuid.cuid()


class Base(DeclarativeBase):
    pass


def _pg_enum(enum_cls, name: str) -> SAEnum:
    """Helper to declare a Postgres enum matching the Prisma-managed type.

    `create_type=False` keeps Alembic/SQLAlchemy from trying to redefine the enum —
    Prisma is the source of truth for DDL.
    """
    return SAEnum(
        enum_cls,
        name=name,
        native_enum=True,
        create_type=False,
        values_callable=lambda e: [m.value for m in e],
    )


# --- core user + profiles ----------------------------------------------------


class User(Base):
    __tablename__ = "User"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    name: Mapped[str | None] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String, unique=True)
    phone: Mapped[str | None] = mapped_column(String, unique=True)
    image: Mapped[str | None] = mapped_column(String)

    # Link to Supabase auth.users.id — set by the auth.users sync trigger or
    # lazily by current_user() when the trigger hasn't fired yet.
    supabaseUserId: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), unique=True
    )

    # Legacy: NextAuth Google sub. Kept while migrating existing rows; will be
    # removed once all users have re-authenticated through Supabase.
    googleId: Mapped[str | None] = mapped_column(String, unique=True)

    role: Mapped[UserRole] = mapped_column(
        _pg_enum(UserRole, "UserRole"), nullable=False, default=UserRole.STUDENT
    )
    roleConfirmed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    isBanned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    isPremium: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    premiumSince: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )

    studentProfile: Mapped[StudentProfile | None] = relationship(back_populates="user", uselist=False)
    employerProfile: Mapped[EmployerProfile | None] = relationship(back_populates="user", uselist=False)


class StudentProfile(Base):
    __tablename__ = "StudentProfile"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    firstName: Mapped[str] = mapped_column(String, nullable=False)
    lastName: Mapped[str | None] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String)
    city: Mapped[str | None] = mapped_column(String)
    dob: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    gender: Mapped[Gender | None] = mapped_column(_pg_enum(Gender, "Gender"))
    bio: Mapped[str | None] = mapped_column(Text)

    resumeUrl: Mapped[str | None] = mapped_column(String)

    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="studentProfile")
    educations: Mapped[list[Education]] = relationship(cascade="all, delete-orphan")
    experiences: Mapped[list[WorkExperience]] = relationship(cascade="all, delete-orphan")
    projects: Mapped[list[Project]] = relationship(cascade="all, delete-orphan")
    skills: Mapped[list[StudentSkill]] = relationship(cascade="all, delete-orphan")
    certifications: Mapped[list[Certification]] = relationship(cascade="all, delete-orphan")
    languages: Mapped[list[Language]] = relationship(cascade="all, delete-orphan")


class Education(Base):
    __tablename__ = "Education"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    studentId: Mapped[str] = mapped_column(
        String, ForeignKey("StudentProfile.id", ondelete="CASCADE"), nullable=False
    )

    institute: Mapped[str] = mapped_column(String, nullable=False)
    degree: Mapped[str] = mapped_column(String, nullable=False)
    fieldOfStudy: Mapped[str | None] = mapped_column(String)
    startYear: Mapped[int] = mapped_column(Integer, nullable=False)
    endYear: Mapped[int | None] = mapped_column(Integer)
    grade: Mapped[str | None] = mapped_column(String)
    current: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class WorkExperience(Base):
    __tablename__ = "WorkExperience"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    studentId: Mapped[str] = mapped_column(
        String, ForeignKey("StudentProfile.id", ondelete="CASCADE"), nullable=False
    )

    company: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str | None] = mapped_column(String)
    startDate: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    endDate: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    current: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    description: Mapped[str | None] = mapped_column(Text)


class Project(Base):
    __tablename__ = "Project"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    studentId: Mapped[str] = mapped_column(
        String, ForeignKey("StudentProfile.id", ondelete="CASCADE"), nullable=False
    )

    title: Mapped[str] = mapped_column(String, nullable=False)
    link: Mapped[str | None] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text)
    startDate: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    endDate: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Skill(Base):
    __tablename__ = "Skill"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)


class StudentSkill(Base):
    __tablename__ = "StudentSkill"

    studentId: Mapped[str] = mapped_column(
        String, ForeignKey("StudentProfile.id", ondelete="CASCADE"), primary_key=True
    )
    skillId: Mapped[str] = mapped_column(
        String, ForeignKey("Skill.id", ondelete="CASCADE"), primary_key=True
    )
    level: Mapped[int | None] = mapped_column(Integer)

    skill: Mapped[Skill] = relationship()


class Certification(Base):
    __tablename__ = "Certification"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    studentId: Mapped[str] = mapped_column(
        String, ForeignKey("StudentProfile.id", ondelete="CASCADE"), nullable=False
    )

    name: Mapped[str] = mapped_column(String, nullable=False)
    issuer: Mapped[str | None] = mapped_column(String)
    issueDate: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    credentialUrl: Mapped[str | None] = mapped_column(String)


class Language(Base):
    __tablename__ = "Language"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    studentId: Mapped[str] = mapped_column(
        String, ForeignKey("StudentProfile.id", ondelete="CASCADE"), nullable=False
    )

    name: Mapped[str] = mapped_column(String, nullable=False)
    proficiency: Mapped[int | None] = mapped_column(Integer)


class EmployerProfile(Base):
    __tablename__ = "EmployerProfile"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    firstName: Mapped[str] = mapped_column(String, nullable=False)
    lastName: Mapped[str | None] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String)
    jobTitle: Mapped[str | None] = mapped_column(String)

    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="employerProfile")


# --- companies ----------------------------------------------------------------


class Company(Base):
    __tablename__ = "Company"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    logoUrl: Mapped[str | None] = mapped_column(String)
    website: Mapped[str | None] = mapped_column(String)
    about: Mapped[str | None] = mapped_column(Text)
    industry: Mapped[str | None] = mapped_column(String)
    size: Mapped[str | None] = mapped_column(String)
    city: Mapped[str | None] = mapped_column(String)

    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )

    members: Mapped[list[CompanyMember]] = relationship(cascade="all, delete-orphan")
    listings: Mapped[list[Listing]] = relationship(back_populates="company", cascade="all, delete-orphan")


class CompanyMember(Base):
    __tablename__ = "CompanyMember"

    companyId: Mapped[str] = mapped_column(
        String, ForeignKey("Company.id", ondelete="CASCADE"), primary_key=True
    )
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), primary_key=True
    )
    role: Mapped[CompanyRole] = mapped_column(
        _pg_enum(CompanyRole, "CompanyRole"), nullable=False, default=CompanyRole.MEMBER
    )
    joinedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship()
    company: Mapped[Company] = relationship(back_populates="members", overlaps="members")


# --- listings & applications -------------------------------------------------


class Listing(Base):
    __tablename__ = "Listing"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    companyId: Mapped[str] = mapped_column(
        String, ForeignKey("Company.id", ondelete="CASCADE"), nullable=False
    )
    postedById: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False
    )

    type: Mapped[ListingType] = mapped_column(_pg_enum(ListingType, "ListingType"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    mode: Mapped[WorkMode] = mapped_column(_pg_enum(WorkMode, "WorkMode"), nullable=False)
    city: Mapped[str | None] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    responsibilities: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    perks: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    preferences: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    skillTagsRaw: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)

    stipendMin: Mapped[int | None] = mapped_column(Integer)
    stipendMax: Mapped[int | None] = mapped_column(Integer)
    currency: Mapped[str | None] = mapped_column(String, default="INR")
    durationMonths: Mapped[int | None] = mapped_column(Integer)
    startDate: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    applyBy: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    openings: Mapped[int | None] = mapped_column(Integer, default=1)
    partTime: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )
    closedAt: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    company: Mapped[Company] = relationship(back_populates="listings", overlaps="listings")
    skills: Mapped[list[ListingSkill]] = relationship(cascade="all, delete-orphan")
    applications: Mapped[list[Application]] = relationship(
        back_populates="listing", cascade="all, delete-orphan"
    )


class ListingSkill(Base):
    __tablename__ = "ListingSkill"

    listingId: Mapped[str] = mapped_column(
        String, ForeignKey("Listing.id", ondelete="CASCADE"), primary_key=True
    )
    skillId: Mapped[str] = mapped_column(
        String, ForeignKey("Skill.id", ondelete="CASCADE"), primary_key=True
    )

    skill: Mapped[Skill] = relationship()


class Application(Base):
    __tablename__ = "Application"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    listingId: Mapped[str] = mapped_column(
        String, ForeignKey("Listing.id", ondelete="CASCADE"), nullable=False
    )
    studentId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False
    )

    status: Mapped[ApplicationStatus] = mapped_column(
        _pg_enum(ApplicationStatus, "ApplicationStatus"),
        nullable=False,
        default=ApplicationStatus.APPLIED,
    )
    coverLetter: Mapped[str | None] = mapped_column(Text)
    resumeUrl: Mapped[str | None] = mapped_column(String)

    appliedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    statusUpdatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    listing: Mapped[Listing] = relationship(back_populates="applications", overlaps="applications")
    student: Mapped[User] = relationship()
    conversation: Mapped[Conversation | None] = relationship(back_populates="application", uselist=False)


# --- chat --------------------------------------------------------------------


class Conversation(Base):
    """One conversation per Application.

    Auto-created on apply. Participants are derived on access: the student
    on the Application + any CompanyMember of the listing's company.
    """

    __tablename__ = "Conversation"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    applicationId: Mapped[str] = mapped_column(
        String,
        ForeignKey("Application.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    lastMessageAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )

    application: Mapped[Application] = relationship(back_populates="conversation")
    messages: Mapped[list[Message]] = relationship(
        back_populates="conversation",
        order_by="Message.createdAt",
        cascade="all, delete-orphan",
    )


class Message(Base):
    __tablename__ = "Message"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    conversationId: Mapped[str] = mapped_column(
        String, ForeignKey("Conversation.id", ondelete="CASCADE"), nullable=False
    )
    senderId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    conversation: Mapped[Conversation] = relationship(back_populates="messages")
    sender: Mapped[User] = relationship()


class SavedListing(Base):
    __tablename__ = "SavedListing"

    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), primary_key=True
    )
    listingId: Mapped[str] = mapped_column(
        String, ForeignKey("Listing.id", ondelete="CASCADE"), primary_key=True
    )
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    listing: Mapped[Listing] = relationship()


# --- assets, payments, notifications -----------------------------------------


class Asset(Base):
    __tablename__ = "Asset"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False
    )

    kind: Mapped[AssetKind] = mapped_column(_pg_enum(AssetKind, "AssetKind"), nullable=False)
    bucket: Mapped[str] = mapped_column(String, nullable=False)
    key: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    url: Mapped[str | None] = mapped_column(String)
    contentType: Mapped[str | None] = mapped_column(String)
    sizeBytes: Mapped[int | None] = mapped_column(Integer)

    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Payment(Base):
    __tablename__ = "Payment"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False
    )

    planCode: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String, nullable=False, default="INR")

    razorpayOrderId: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    razorpayPaymentId: Mapped[str | None] = mapped_column(String, unique=True)
    razorpaySignature: Mapped[str | None] = mapped_column(String)

    status: Mapped[PaymentStatus] = mapped_column(
        _pg_enum(PaymentStatus, "PaymentStatus"), nullable=False, default=PaymentStatus.CREATED
    )

    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )


class Notification(Base):
    __tablename__ = "Notification"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False
    )

    type: Mapped[NotificationType] = mapped_column(
        _pg_enum(NotificationType, "NotificationType"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str | None] = mapped_column(Text)
    link: Mapped[str | None] = mapped_column(String)

    readAt: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
