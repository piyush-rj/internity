from pydantic import BaseModel, Field, field_validator

from app.core.plans import is_plan_code


class OrderIn(BaseModel):
    planCode: str

    @field_validator("planCode")
    @classmethod
    def _check_plan(cls, v: str) -> str:
        if not is_plan_code(v):
            raise ValueError("Unknown plan")
        return v


class VerifyIn(BaseModel):
    planCode: str
    razorpay_order_id: str = Field(min_length=1)
    razorpay_payment_id: str = Field(min_length=1)
    razorpay_signature: str = Field(min_length=1)

    @field_validator("planCode")
    @classmethod
    def _check_plan(cls, v: str) -> str:
        if not is_plan_code(v):
            raise ValueError("Unknown plan")
        return v
