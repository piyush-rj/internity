import { api } from "../apiClient";

export type NotificationType =
    | "APPLICATION_RECEIVED"
    | "APPLICATION_STATUS_CHANGED"
    | "APPLICATION_WITHDRAWN"
    | "LISTING_CLOSED"
    | "COMPANY_MEMBER_ADDED"
    | "COMPANY_APPROVED"
    | "COMPANY_REJECTED"
    | "SUBSCRIPTION_ACTIVATED"
    | "GENERIC";

export type AppNotification = {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string | null;
    link: string | null;
    readAt: string | null;
    createdAt: string;
};

export const notificationApi = {
    list: (limit?: number) =>
        api.get<{ items: AppNotification[]; unread: number }>(
            "/notification",
            limit ? { limit } : undefined,
        ),
    mark_read: (id: string) =>
        api.patch<{ notification: AppNotification }>(
            `/notification/${id}/read`,
            {},
        ),
    mark_all_read: () =>
        api.post<{ updated: number }>("/notification/read-all"),
};
