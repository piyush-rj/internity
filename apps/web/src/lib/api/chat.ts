import { api } from "../apiClient";
import type { ChatMessage, ConversationListItem } from "types";

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

    start_conversation: (applicationId: string) =>
        api.post<{ id: string }>("/chat/conversations", { applicationId }),

    start_admin_conversation: () =>
        api.post<{ id: string }>("/chat/admin-conversation"),

    mark_read: (conversationId: string) =>
        api.post<{ readAt: string }>(
            `/chat/conversations/${conversationId}/read`,
        ),

    unread_count: () => api.get<{ count: number }>("/chat/unread-count"),
};

export type { ChatMessage, ConversationListItem };
