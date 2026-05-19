import { create } from "zustand";

interface AuthDialogState {
    open: boolean;
    /** Where to send the user after successful sign-in. */
    nextPath: string;
    openDialog: (nextPath?: string) => void;
    closeDialog: () => void;
}

export const useAuthDialog = create<AuthDialogState>((set) => ({
    open: false,
    nextPath: "/home/dashboard",
    openDialog: (nextPath = "/home/dashboard") => set({ open: true, nextPath }),
    closeDialog: () => set({ open: false }),
}));
