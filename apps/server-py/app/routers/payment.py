"""Razorpay-backed paid upgrade.

Two endpoints: `/order` issues a Razorpay order and stores a CREATED Payment
row; `/verify` checks the HMAC signature, flips Payment to SUCCESS and the
user to premium in a single transaction, and notifies the user.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import time
from datetime import datetime, timezone
from functools import lru_cache

import razorpay
from fastapi import APIRouter
from sqlalchemy import update

from app.config import settings
from app.core.plans import PLANS
from app.db import models
from app.db.enums import NotificationType, PaymentStatus
from app.deps import CurrentUser, DbSession
from app.responses import ApiError, InvalidRequest, ok
from app.schemas.payment import OrderIn, VerifyIn
from app.services.notification import notify

log = logging.getLogger(__name__)
router = APIRouter(prefix="/payment", tags=["payment"])


@lru_cache(maxsize=1)
def _client() -> razorpay.Client | None:
    if not settings.SERVER_RAZORPAY_ID or not settings.SERVER_RAZORPAY_SECRET:
        return None
    return razorpay.Client(auth=(settings.SERVER_RAZORPAY_ID, settings.SERVER_RAZORPAY_SECRET))


class _GatewayNotConfigured(ApiError):
    code = "INTERNAL_SERVER_ERROR"
    status_code = 500
    default_message = (
        "Payment gateway not configured. Set SERVER_RAZORPAY_ID and SERVER_RAZORPAY_SECRET."
    )


@router.post("/order")
def create_order(body: OrderIn, user: CurrentUser, db: DbSession):
    client = _client()
    if client is None or not settings.SERVER_RAZORPAY_ID:
        raise _GatewayNotConfigured()

    plan = PLANS[body.planCode]
    receipt = f"r_{user.id[-8:]}_{format(int(time.time() * 1000), 'x')}"
    order = client.order.create(
        data={
            "amount": plan["amount"],
            "currency": plan["currency"],
            "receipt": receipt,
            "notes": {"userId": user.id, "planCode": plan["code"]},
        }
    )

    db.add(
        models.Payment(
            userId=user.id,
            planCode=plan["code"],
            amount=plan["amount"],
            currency=plan["currency"],
            razorpayOrderId=order["id"],
            status=PaymentStatus.CREATED,
        )
    )
    db.commit()

    return ok(
        {
            "orderId": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "keyId": settings.SERVER_RAZORPAY_ID,
            "planName": plan["name"],
            "planDescription": plan["description"],
        }
    )


@router.post("/verify")
def verify_payment(body: VerifyIn, user: CurrentUser, db: DbSession):
    if not settings.SERVER_RAZORPAY_SECRET:
        raise _GatewayNotConfigured("Payment gateway not configured.")

    expected = hmac.new(
        settings.SERVER_RAZORPAY_SECRET.encode(),
        f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, body.razorpay_signature):
        # Best-effort: flag the matching CREATED row as FAILED so it isn't retried.
        try:
            db.execute(
                update(models.Payment)
                .where(
                    models.Payment.razorpayOrderId == body.razorpay_order_id,
                    models.Payment.userId == user.id,
                    models.Payment.status == PaymentStatus.CREATED,
                )
                .values(status=PaymentStatus.FAILED)
            )
            db.commit()
        except Exception:  # noqa: BLE001
            log.exception("could not mark payment failed")
            db.rollback()
        raise InvalidRequest("Invalid payment signature")

    plan = PLANS[body.planCode]
    # Atomic: payment success + premium flag flip
    db.execute(
        update(models.Payment)
        .where(
            models.Payment.razorpayOrderId == body.razorpay_order_id,
            models.Payment.userId == user.id,
        )
        .values(
            status=PaymentStatus.SUCCESS,
            razorpayPaymentId=body.razorpay_payment_id,
            razorpaySignature=body.razorpay_signature,
        )
    )
    db.execute(
        update(models.User)
        .where(models.User.id == user.id)
        .values(isPremium=True, premiumSince=datetime.now(timezone.utc))
    )
    db.commit()

    notify(
        db,
        user_id=user.id,
        type=NotificationType.SUBSCRIPTION_ACTIVATED,
        title=f"Welcome to {plan['name']}",
        body="Your upgrade is active. Enjoy unlimited applications, priority support, and mentor sessions.",
        link="/home",
    )

    return ok({"ok": True, "planCode": plan["code"]})
