"""FastAPI dependencies.

`get_db` is re-exported from `app.db`. The rest enforce auth and authorization.
"""

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, Request
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core import jwt as jwt_service
from app.db import get_db
from app.db.enums import CompanyRole, UserRole
from app.db.models import CompanyMember, User
from app.responses import Forbidden, InvalidRequest, Unauthorized


@dataclass
class AuthUser:
    id: str  # public.User.id (cuid)
    email: str | None
    name: str | None
    role: UserRole


DbSession = Annotated[Session, Depends(get_db)]


def current_user(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> AuthUser:
    """Resolve the calling user from a Supabase Auth Bearer token.

    The token's `sub` is auth.users.id (a uuid). We look up the matching
    public.User row by supabaseUserId, falling back to email/phone if the
    sync trigger hasn't fired yet (the row will be linked on next signal).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise Unauthorized()
    token = authorization[len("Bearer ") :].strip()
    if not token:
        raise Unauthorized()

    claims = jwt_service.verify(token)
    if claims is None:
        raise Unauthorized()

    supabase_user_id = claims.get("sub")
    email = claims.get("email")
    phone = claims.get("phone")
    if not supabase_user_id:
        raise Unauthorized()

    user = db.execute(
        select(User).where(User.supabaseUserId == supabase_user_id)
    ).scalar_one_or_none()

    if user is None and (email or phone):
        conditions = []
        if email:
            conditions.append(User.email == email)
        if phone:
            conditions.append(User.phone == phone)
        user = db.execute(select(User).where(or_(*conditions))).scalar_one_or_none()
        if user is not None and user.supabaseUserId is None:
            user.supabaseUserId = supabase_user_id
            db.commit()
            db.refresh(user)

    if user is None:
        raise Unauthorized()

    return AuthUser(id=user.id, email=user.email, name=user.name, role=user.role)


CurrentUser = Annotated[AuthUser, Depends(current_user)]


def require_role(*roles: UserRole):
    """Build a dependency that allows only the listed user roles."""

    def _dep(user: CurrentUser) -> AuthUser:
        if user.role not in roles:
            raise Forbidden("Forbidden: insufficient role")
        return user

    return _dep


def require_company_member(
    *,
    param_key: str = "id",
    owner_only: bool = False,
):
    """Build a dependency that checks the caller belongs to the company in the URL.

    The dependency function pulls the company id from `request.path_params[param_key]`
    so route authors don't need to repeat the parameter name.
    """

    def _dep(request: Request, user: CurrentUser, db: DbSession) -> CompanyMember:
        company_id = request.path_params.get(param_key)
        if not isinstance(company_id, str):
            raise InvalidRequest("Missing company id")
        member = db.execute(
            select(CompanyMember).where(
                CompanyMember.companyId == company_id,
                CompanyMember.userId == user.id,
            )
        ).scalar_one_or_none()
        if member is None:
            raise Forbidden("Not a member of this company")
        if owner_only and member.role != CompanyRole.OWNER:
            raise Forbidden("Owner-only action")
        return member

    return _dep
