"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/src/lib/utils";

// slide-from-left mobile nav drawer portalled to body
export function MobileNavDrawer({
    open,
    onClose,
    children,
    width = 256,
    ariaLabel = "Navigation",
}: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    width?: number;
    ariaLabel?: string;
}) {
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <>
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-black/40 transition-opacity",
                    open ? "opacity-100" : "pointer-events-none opacity-0",
                )}
                onClick={onClose}
                aria-hidden
            />
            <aside
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                style={{ width }}
                className={cn(
                    "fixed top-0 left-0 h-full z-[101]",
                    "bg-sidebar border-r border-sidebar-border shadow-2xl",
                    "flex flex-col",
                    "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    open ? "translate-x-0" : "-translate-x-full",
                )}
            >
                {children}
            </aside>
        </>,
        document.body,
    );
}
