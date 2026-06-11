// Local persistence for the support-agent session. Unlike regular users (who
// authenticate via Supabase cookies), the support agent holds a bearer token
// minted by the backend's /auth/support-login. When present, the shared API
// client and chat socket use it instead of the Supabase session.
const STORAGE_KEY = "spiderskill.support_token";

export function getSupportToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

export function setSupportToken(token: string): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, token);
    } catch {
        // ignore storage failures (private mode, etc.)
    }
}

export function clearSupportToken(): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}
