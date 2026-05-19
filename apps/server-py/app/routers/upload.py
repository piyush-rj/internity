"""S3 upload flow: presign a PUT, then confirm to register the asset and
update the relevant pointer (resume on the student profile, image on the
user, or logo on the company).
"""

from fastapi import APIRouter
from sqlalchemy import select, update

from app.core import storage
from app.db import models
from app.db.enums import AssetKind, CompanyRole
from app.deps import CurrentUser, DbSession
from app.responses import Forbidden, InvalidRequest, NotFound, ok
from app.schemas.upload import ConfirmIn, SignIn
from app.serializers import asset

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/sign")
def sign(body: SignIn, user: CurrentUser):
    """Hand the browser a short-lived presigned PUT URL plus the
    final public GET URL it should reference once the upload completes.
    """
    key = storage.build_object_key(body.kind, user.id)
    put_url = storage.presign_put(key, body.contentType)
    get_url = storage.public_url_for(key)
    return ok({"key": key, "putUrl": put_url, "getUrl": get_url})


@router.post("/confirm")
def confirm(body: ConfirmIn, user: CurrentUser, db: DbSession):
    """Called after the browser finishes the PUT. We persist an `Asset` row
    and update the matching pointer on the user / profile / company.
    """
    if body.kind == AssetKind.COMPANY_LOGO:
        if body.companyId is None:
            raise InvalidRequest("companyId is required for COMPANY_LOGO")
        member = db.execute(
            select(models.CompanyMember).where(
                models.CompanyMember.companyId == body.companyId,
                models.CompanyMember.userId == user.id,
            )
        ).scalar_one_or_none()
        if member is None or member.role != CompanyRole.OWNER:
            raise Forbidden("Owner-only action")

    url = storage.public_url_for(body.key)
    new_asset = models.Asset(
        userId=user.id,
        kind=body.kind,
        bucket=storage.bucket(),
        key=body.key,
        url=url,
        contentType=body.contentType,
        sizeBytes=body.sizeBytes,
    )
    db.add(new_asset)

    if body.kind == AssetKind.RESUME:
        db.execute(
            update(models.StudentProfile)
            .where(models.StudentProfile.userId == user.id)
            .values(resumeUrl=url)
        )
    elif body.kind == AssetKind.PROFILE_IMAGE:
        db.execute(update(models.User).where(models.User.id == user.id).values(image=url))
    elif body.kind == AssetKind.COMPANY_LOGO and body.companyId is not None:
        db.execute(
            update(models.Company).where(models.Company.id == body.companyId).values(logoUrl=url)
        )

    db.commit()
    db.refresh(new_asset)
    return ok({"asset": asset(new_asset)}, "Upload confirmed", 201)


@router.delete("/{asset_id}")
def remove(asset_id: str, user: CurrentUser, db: DbSession):
    a = db.get(models.Asset, asset_id)
    if a is None or a.userId != user.id:
        raise NotFound()
    storage.delete_object(a.key)
    db.delete(a)
    db.commit()
    return ok({"ok": True})
