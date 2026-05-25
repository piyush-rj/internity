import type { ChatMessage } from "types";

// message bubble; optimistic bubbles carry clientId until server echo
export type Bubble = ChatMessage & { clientId?: string };

export type DayGroup = {
    dayKey: string;
    label: string;
    messages: Bubble[];
};

export function groupByDay(messages: Bubble[]): DayGroup[] {
    const groups: DayGroup[] = [];
    for (const m of messages) {
        const d = new Date(m.createdAt);
        const key = dayKey(d);
        const last = groups[groups.length - 1];
        if (last && last.dayKey === key) {
            last.messages.push(m);
        } else {
            groups.push({ dayKey: key, label: formatDay(d), messages: [m] });
        }
    }
    return groups;
}

function dayKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function formatDay(d: Date): string {
    const today = new Date();
    if (dayKey(d) === dayKey(today)) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (dayKey(d) === dayKey(yesterday)) return "Yesterday";
    const sameYear = d.getFullYear() === today.getFullYear();
    return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        ...(sameYear ? {} : { year: "numeric" }),
    });
}

export function formatTime(d: Date): string {
    return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function makeClientId(): string {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// reconciles inbound message with optimistic bubbles by clientId or id
export function mergeIncoming(
    prev: Bubble[],
    message: ChatMessage,
    clientId: string | undefined,
): Bubble[] {
    if (clientId) {
        const idx = prev.findIndex((m) => m.clientId === clientId);
        if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...message };
            return next;
        }
    }
    if (prev.some((m) => m.id === message.id)) return prev;
    return [...prev, message];
}
