"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/src/lib/utils";

// slide-in drawer portalled to body; slides from left by default
export function MobileNavDrawer({
    open,
    onClose,
    children,
    width = 256,
    ariaLabel = "Navigation",
    side = "left",
}: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    width?: number;
    ariaLabel?: string;
    side?: "left" | "right";
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

    const isRight = side === "right";
    const closedTranslate = isRight ? "translate-x-full" : "-translate-x-full";

    return createPortal(
        <>
            <div
                className={cn(
                    "fixed inset-0 z-100 bg-black/40 transition-opacity",
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
                    "fixed top-0 h-full z-101 flex flex-col shadow-2xl",
                    "bg-card",
                    isRight
                        ? "right-0 border-l border-border"
                        : "left-0 border-r border-sidebar-border bg-sidebar",
                    "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    open ? "translate-x-0" : closedTranslate,
                )}
            >
                {children}
            </aside>
        </>,
        document.body,
    );
}
