import { api } from "../apiClient";
import type { ChatMessage, ConversationListItem } from "../ws/chat-types";

export const chatApi = {
    list_conversations: () =>
        api.get<ConversationListItem[]>("/chat/conversations"),

    list_messages: (
        conversationId: string,
        params?: { before?: string; limit?: number },
    ) =>
        api.get<ChatMessage[]>(
            `/chat/conversations/${conversationId}/messages`,
            params,
        ),
};

export type { ChatMessage, ConversationListItem };
