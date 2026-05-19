from fastapi import APIRouter

from app.db.enums import UserRole
from app.db.models import User
from app.deps import CurrentUser, DbSession
from app.responses import NotFound, ok
from app.schemas.auth import SetRoleIn, UpdateMeIn

router = APIRouter(prefix="/auth", tags=["auth"])


def _me_payload(db_user: User) -> dict:
    return {
        "id": db_user.id,
        "name": db_user.name,
        "email": db_user.email,
        "phone": db_user.phone,
        "image": db_user.image,
        "role": db_user.role,
        "roleConfirmed": db_user.roleConfirmed,
        "isPremium": db_user.isPremium,
        "needsOnboarding": db_user.name is None or not db_user.name.strip(),
        "hasStudentProfile": db_user.studentProfile is not None,
        "hasEmployerProfile": db_user.employerProfile is not None,
    }


@router.get("/me")
def get_me(user: CurrentUser, db: DbSession):
    """Lightweight identity payload. `needsOnboarding` is true when the
    user has no display name yet (typical for phone-only signups before
    the client captures first + last name).
    """
    db_user = db.get(User, user.id)
    if db_user is None:
        raise NotFound()
    return ok(_me_payload(db_user))


@router.patch("/me")
def update_me(body: UpdateMeIn, user: CurrentUser, db: DbSession):
    db_user = db.get(User, user.id)
    if db_user is None:
        raise NotFound()
    if body.name is not None:
        db_user.name = body.name.strip()
    db.commit()
    db.refresh(db_user)
    return ok(_me_payload(db_user), "Profile updated")


@router.post("/role")
def set_role(body: SetRoleIn, user: CurrentUser, db: DbSession):
    db_user = db.get(User, user.id)
    if db_user is None:
        raise NotFound()
    db_user.role = UserRole(body.role)
    db_user.roleConfirmed = True
    db.commit()
    db.refresh(db_user)
    return ok({"role": db_user.role, "roleConfirmed": True}, "Role updated")
