"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/src/lib/utils";

/**
 * Slide-from-left mobile drawer that hosts an arbitrary nav body (home or
 * admin). Portal'd to `document.body` to escape any local stacking context,
 * and uses z-[100]/[101] so it covers the topbar (z-30) and any sticky
 * content. Esc + backdrop-click close it; `onClose` is also fired when the
 * inner nav reports a navigation (so picking a destination collapses the
 * drawer naturally).
 */
export function MobileNavDrawer({
    open,
    onClose,
    children,
    width = 256,
    ariaLabel = "Navigation",
}: {
    open: boolean;
    onClose: () => void;
    /** Sidebar body. The body should call `onClose` (passed via render-prop
     *  or its own `onNavigate`) when the user picks a destination. */
    children: React.ReactNode;
    width?: number;
    ariaLabel?: string;
}) {
    // Esc to close.
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    // Lock body scroll while the drawer is open so backdrop swipes don't
    // double-scroll the underlying page.
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    // Wait until mounted in the browser before portalling.
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <>
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-black/40 transition-opacity",
                    open
                        ? "opacity-100"
                        : "pointer-events-none opacity-0",
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
