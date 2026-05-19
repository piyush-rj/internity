from pydantic import BaseModel, Field

from app.db.enums import AssetKind


class SignIn(BaseModel):
    kind: AssetKind
    contentType: str
    sizeBytes: int = Field(gt=0)


class ConfirmIn(BaseModel):
    kind: AssetKind
    key: str
    contentType: str
    sizeBytes: int = Field(gt=0)
    companyId: str | None = None
