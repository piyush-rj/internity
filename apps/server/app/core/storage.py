"""MinIO / S3 object storage.

Wraps boto3 with helpers tailored to our upload flow: presigned PUTs for
browsers to upload directly, presigned GETs for short-lived downloads, and a
permanent public URL when the bucket is served behind a CDN/proxy.
"""

from __future__ import annotations

import uuid
from functools import lru_cache

import boto3
from botocore.client import Config

from app.config import settings


@lru_cache(maxsize=1)
def _s3():
    return boto3.client(
        "s3",
        endpoint_url=str(settings.MINIO_ENDPOINT),
        region_name=settings.MINIO_REGION,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )


def bucket() -> str:
    return settings.MINIO_BUCKET


def build_object_key(kind: str, user_id: str) -> str:
    return f"{kind.lower()}/{user_id}/{uuid.uuid4()}"


def presign_put(key: str, content_type: str, expires_in_sec: int = 300) -> str:
    return _s3().generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket(), "Key": key, "ContentType": content_type},
        ExpiresIn=expires_in_sec,
    )


def presign_get(key: str, expires_in_sec: int = 3600) -> str:
    return _s3().generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket(), "Key": key},
        ExpiresIn=expires_in_sec,
    )


def delete_object(key: str) -> None:
    _s3().delete_object(Bucket=bucket(), Key=key)


def public_url_for(key: str) -> str:
    base = str(settings.MINIO_PUBLIC_ENDPOINT or settings.MINIO_ENDPOINT).rstrip("/")
    return f"{base}/{bucket()}/{key}"
