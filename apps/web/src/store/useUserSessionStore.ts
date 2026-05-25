import { create } from "zustand";

export type SessionUser = {
    id: string | null;
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
    initialized: boolean;
    setSession: (session: AppSession) => void;
}

export const useUserSessionStore = create<UserSessionStoreData>((set) => ({
    session: null,
    initialized: false,
    setSession: (session) => set({ session, initialized: true }),
}));
