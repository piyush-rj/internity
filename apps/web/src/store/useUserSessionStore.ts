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
    setSession: (session: AppSession) => void;
}

export const useUserSessionStore = create<UserSessionStoreData>((set) => ({
    session: null,
    setSession: (session) => set({ session }),
}));
