from fastapi import APIRouter
from sqlalchemy import select

from app.core import jwt as jwt_service
from app.db.enums import UserRole
from app.db.models import User
from app.deps import CurrentUser, DbSession
from app.responses import NotFound, ok
from app.schemas.auth import SetRoleIn, SignInIn
from app.serializers import user_full

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sign-in")
def sign_in(body: SignInIn, db: DbSession):
    """Upsert by Google ID, then issue a JWT carrying the user identity."""
    image = str(body.image) if body.image is not None else None
    user = db.execute(select(User).where(User.googleId == body.googleId)).scalar_one_or_none()
    if user is None:
        user = User(googleId=body.googleId, email=body.email, name=body.name, image=image)
        db.add(user)
    else:
        user.name = body.name
        user.email = body.email
        user.image = image
    db.commit()
    db.refresh(user)

    token = jwt_service.issue(
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "image": user.image,
            "role": user.role,
        }
    )
    return ok({"user": user_full(user), "token": token}, "Signed in")


@router.get("/me")
def get_me(user: CurrentUser, db: DbSession):
    """Lightweight identity payload — includes `hasStudentProfile`/`hasEmployerProfile`
    so the frontend can route to the right onboarding step.
    """
    db_user = db.get(User, user.id)
    if db_user is None:
        raise NotFound()
    return ok(
        {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "image": db_user.image,
            "role": db_user.role,
            "isPremium": db_user.isPremium,
            "hasStudentProfile": db_user.studentProfile is not None,
            "hasEmployerProfile": db_user.employerProfile is not None,
        }
    )


@router.post("/role")
def set_role(body: SetRoleIn, user: CurrentUser, db: DbSession):
    db_user = db.get(User, user.id)
    if db_user is None:
        raise NotFound()
    db_user.role = UserRole(body.role)
    db.commit()
    db.refresh(db_user)
    return ok({"role": db_user.role}, "Role updated")
