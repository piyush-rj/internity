import { create } from "zustand";

export type SessionUser = {
    id: string | null; // Supabase auth.users.id (uuid)
    name: string | null;
    email: string | null;
    image: string | null;
    phone: string | null;
};

export type AppSession = {
    user: SessionUser;
} | null;

interface UserSessionStoreData {
    session: AppSession;
    /**
     * `false` until the first Supabase session check completes after page
     * load. Guards (AdminGuard, etc.) must wait for this before deciding to
     * redirect, otherwise a hard refresh kicks the user out before Supabase
     * has even read its cookie.
     */
    initialized: boolean;
    setSession: (session: AppSession) => void;
}

export const useUserSessionStore = create<UserSessionStoreData>((set) => ({
    session: null,
    initialized: false,
    setSession: (session) => set({ session, initialized: true }),
}));
