"""Plan catalogue for paid upgrades. Amounts are in the smallest currency unit
(paise for INR).
"""

from typing import TypedDict


class Plan(TypedDict):
    code: str
    name: str
    description: str
    amount: int
    currency: str


PLANS: dict[str, Plan] = {
    "PRO": {
        "code": "PRO",
        "name": "Internity Pro",
        "description": "Unlimited applications, priority support, mentor sessions",
        "amount": 49900,
        "currency": "INR",
    },
}


def is_plan_code(value: str) -> bool:
    return value in PLANS
