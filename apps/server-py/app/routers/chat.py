"""Chat routes — REST (list conversations, message history) and the WS endpoint.

Authorization model (single rule, used everywhere here):

    A user may participate in a Conversation iff they are
      (a) the student on the linked Application, OR
      (b) a CompanyMember of the listing's company.

The helpers `_participants_of` and `_assert_can_access` encapsulate that
check so the REST and WS sides stay in lockstep.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Path, WebSocket
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload
from starlette.websockets import WebSocketDisconnect

from app.core.ws import AuthFailed, CustomWS
from app.db import get_db
from app.db.enums import UserRole
from app.db.models import (
    Application,
    CompanyMember,
    Conversation,
    Listing,
    Message,
    User,
)
from app.deps import CurrentUser, DbSession
from app.responses import Forbidden, NotFound, ok
from app.schemas.chat import (
    ConversationListItem,
    ConversationPeer,
    MessageDTO,
    SError,
    SMessageCreated,
    SPong,
)
from app.services.chat_connections import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


# --- authorization helpers ---------------------------------------------------


def _participants_of(db: Session, conversation: Conversation) -> list[str]:
    """User IDs allowed to read/write in this conversation."""
    listing = db.get(Listing, conversation.application.listingId)
    if listing is None:
        return [conversation.application.studentId]
    company_member_ids = db.execute(
        select(CompanyMember.userId).where(
            CompanyMember.companyId == listing.companyId
        )
    ).scalars().all()
    return list({conversation.application.studentId, *company_member_ids})


def _assert_can_access(db: Session, conversation: Conversation, user_id: str) -> None:
    if user_id not in _participants_of(db, conversation):
        raise Forbidden("Not a participant in this conversation")


def _load_conversation_with_context(
    db: Session, conversation_id: str
) -> Conversation | None:
    return db.execute(
        select(Conversation)
        .options(joinedload(Conversation.application).joinedload(Application.listing))
        .where(Conversation.id == conversation_id)
    ).unique().scalar_one_or_none()


# --- REST --------------------------------------------------------------------


@router.get("/conversations")
def list_conversations(user: CurrentUser, db: DbSession):
    """List the calling user's conversations, newest activity first."""
    student_apps = select(Application.id).where(Application.studentId == user.id)

    employer_company_ids = (
        select(CompanyMember.companyId)
        .where(CompanyMember.userId == user.id)
        .scalar_subquery()
    )
    employer_apps = (
        select(Application.id)
        .join(Listing, Listing.id == Application.listingId)
        .where(Listing.companyId.in_(employer_company_ids))
    )

    conversations = db.execute(
        select(Conversation)
        .options(
            joinedload(Conversation.application)
            .joinedload(Application.student),
            joinedload(Conversation.application)
            .joinedload(Application.listing)
            .joinedload(Listing.company),
        )
        .where(
            Conversation.applicationId.in_(student_apps.union(employer_apps))
        )
        .order_by(desc(Conversation.lastMessageAt))
    ).unique().scalars().all()

    items: list[ConversationListItem] = []
    for c in conversations:
        last = db.execute(
            select(Message)
            .where(Message.conversationId == c.id)
            .order_by(desc(Message.createdAt))
            .limit(1)
        ).scalar_one_or_none()

        peer = _resolve_peer(db, c, viewer_id=user.id, viewer_role=user.role)
        items.append(
            ConversationListItem(
                id=c.id,
                applicationId=c.applicationId,
                listingId=c.application.listingId,
                listingTitle=c.application.listing.title,
                companyName=c.application.listing.company.name,
                peer=peer,
                lastMessageAt=c.lastMessageAt,
                lastMessagePreview=(last.body[:80] if last else None),
                unread=False,  # placeholder — read receipts are a follow-up
            )
        )
    return ok([item.model_dump(mode="json") for item in items])


@router.get("/conversations/{conversation_id}/messages")
def list_messages(
    conversation_id: Annotated[str, Path(min_length=1)],
    user: CurrentUser,
    db: DbSession,
    before: datetime | None = None,
    limit: int = 50,
):
    """Paginated message history, newest first. `before` is exclusive."""
    conv = _load_conversation_with_context(db, conversation_id)
    if conv is None:
        raise NotFound()
    _assert_can_access(db, conv, user.id)

    limit = max(1, min(limit, 100))
    query = select(Message).where(Message.conversationId == conv.id)
    if before is not None:
        query = query.where(Message.createdAt < before)
    rows = db.execute(query.order_by(desc(Message.createdAt)).limit(limit)).scalars().all()

    payload = [
        MessageDTO(
            id=m.id,
            conversationId=m.conversationId,
            senderId=m.senderId,
            body=m.body,
            createdAt=m.createdAt,
        ).model_dump(mode="json")
        for m in rows
    ]
    return ok(payload)


# --- WebSocket ---------------------------------------------------------------


@router.websocket("/ws")
async def chat_socket(
    websocket: WebSocket,
    db: Annotated[Session, Depends(get_db)],
):
    """Single persistent socket per user. Messages are addressed by
    `conversationId` in the payload — there is no per-conversation socket.
    """
    ws = CustomWS(websocket)
    await ws.accept()

    try:
        user = await ws.authenticate(db)
    except AuthFailed as exc:
        logger.info("chat ws auth failed: %s", exc)
        return

    await manager.register(user.id, ws)
    try:
        await _serve(ws, db)
    except WebSocketDisconnect:
        pass
    finally:
        await manager.unregister(user.id, ws)


async def _serve(ws: CustomWS, db: Session) -> None:
    """Main receive loop. One iteration per incoming client message."""
    while True:
        try:
            msg = await ws.recv()
        except ValidationError as exc:
            await ws.send(
                SError(
                    code="invalid_payload",
                    message=exc.errors()[0]["msg"],
                )
            )
            continue

        if msg.type == "ping":
            await ws.send(SPong())
            continue

        if msg.type == "auth":
            # Already authenticated — reject re-auth attempts so a stale
            # client can't silently rotate identity mid-session.
            await ws.send(
                SError(code="forbidden", message="Already authenticated.")
            )
            continue

        if msg.type == "send_message":
            await _handle_send_message(
                ws,
                db,
                conversation_id=msg.conversationId,
                body=msg.body,
            )
            continue


async def _handle_send_message(
    ws: CustomWS,
    db: Session,
    *,
    conversation_id: str,
    body: str,
) -> None:
    conv = _load_conversation_with_context(db, conversation_id)
    if conv is None:
        await ws.send(SError(code="not_found", message="Conversation not found."))
        return

    participants = _participants_of(db, conv)
    if ws.user.id not in participants:
        await ws.send(SError(code="forbidden", message="Not a participant."))
        return

    msg = Message(conversationId=conv.id, senderId=ws.user.id, body=body)
    conv.lastMessageAt = msg.createdAt or datetime.utcnow()
    db.add(msg)
    db.commit()
    db.refresh(msg)

    payload = SMessageCreated(
        message=MessageDTO(
            id=msg.id,
            conversationId=msg.conversationId,
            senderId=msg.senderId,
            body=msg.body,
            createdAt=msg.createdAt,
        )
    )
    await manager.send_to_users(participants, payload)


# --- helpers -----------------------------------------------------------------


def _resolve_peer(
    db: Session,
    conv: Conversation,
    *,
    viewer_id: str,
    viewer_role: UserRole,
) -> ConversationPeer:
    """Figure out who the "other party" is from the viewer's perspective.

    Student viewer → peer is the listing poster (the recruiter contact).
    Company-member viewer → peer is the applicant student.
    """
    student = conv.application.student
    if viewer_id == student.id:
        poster = db.get(User, conv.application.listing.postedById)
        if poster is None:
            return ConversationPeer(id=student.id, name=student.name, image=student.image)
        return ConversationPeer(id=poster.id, name=poster.name, image=poster.image)
    return ConversationPeer(id=student.id, name=student.name, image=student.image)


# --- internal: convenience used by application.py ----------------------------


class _AutoCreateOut(BaseModel):
    conversationId: str = Field(min_length=1)


def ensure_conversation_for_application(db: Session, application_id: str) -> Conversation:
    """Idempotently get-or-create the Conversation for an Application.

    Imported by application.apply() so a new applicant immediately has an
    open channel to the company. Safe to call multiple times.
    """
    existing = db.execute(
        select(Conversation).where(Conversation.applicationId == application_id)
    ).scalar_one_or_none()
    if existing is not None:
        return existing
    conv = Conversation(applicationId=application_id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv
