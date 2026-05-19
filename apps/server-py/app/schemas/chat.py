"""WebSocket payload schemas for chat.

The two unions below mirror the TypeScript discriminated unions in
`apps/web/src/lib/ws/chat-types.ts` exactly. Keep these two files in sync
when changing message shapes — that's the single source of contract.
"""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field


# --- shared DTOs -------------------------------------------------------------


class MessageDTO(BaseModel):
    """Serialized form of a chat message — same shape everywhere it appears."""

    id: str
    conversationId: str
    senderId: str
    body: str
    createdAt: datetime


# --- client -> server --------------------------------------------------------


class CAuth(BaseModel):
    type: Literal["auth"] = "auth"
    token: str


class CSendMessage(BaseModel):
    type: Literal["send_message"] = "send_message"
    conversationId: str
    body: Annotated[str, Field(min_length=1, max_length=4000)]


class CPing(BaseModel):
    """Client keepalive. Server replies with a Pong to confirm liveness."""

    type: Literal["ping"] = "ping"


ClientMessage = Annotated[
    CAuth | CSendMessage | CPing,
    Field(discriminator="type"),
]


# --- server -> client --------------------------------------------------------


class SConnected(BaseModel):
    type: Literal["connected"] = "connected"
    userId: str


class SMessageCreated(BaseModel):
    type: Literal["message_created"] = "message_created"
    message: MessageDTO


class SError(BaseModel):
    type: Literal["error"] = "error"
    code: Literal[
        "unauthorized",
        "invalid_payload",
        "forbidden",
        "not_found",
        "internal",
    ]
    message: str


class SPong(BaseModel):
    type: Literal["pong"] = "pong"


ServerMessage = Annotated[
    SConnected | SMessageCreated | SError | SPong,
    Field(discriminator="type"),
]


# --- REST payloads -----------------------------------------------------------


class ConversationListItem(BaseModel):
    """Row in the user's conversation list. `peer` is the *other* party,
    derived per request so the same Conversation row renders differently
    for the student vs. the company member viewing it.
    """

    id: str
    applicationId: str
    listingId: str
    listingTitle: str
    companyName: str
    peer: "ConversationPeer"
    lastMessageAt: datetime
    lastMessagePreview: str | None
    unread: bool


class ConversationPeer(BaseModel):
    id: str
    name: str | None
    image: str | None


ConversationListItem.model_rebuild()
