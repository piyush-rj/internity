"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "destructive";
    busy?: boolean;
    onCancel: () => void;
    onConfirm: () => void | Promise<void>;
};

// centered modal confirmation dialog portalled to body
export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",
    busy = false,
    onCancel,
    onConfirm,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && !busy) onCancel();
            if (e.key === "Enter" && !busy) onConfirm();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, busy, onCancel, onConfirm]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!open || !mounted) return null;

    const isDestructive = variant === "destructive";

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-[100] bg-black/30"
                onClick={() => !busy && onCancel()}
                aria-hidden
            />
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                className={cn(
                    "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101]",
                    "w-full max-w-sm mx-4 rounded-lg border border-border bg-background shadow-2xl",
                    "flex flex-col",
                )}
            >
                <header className="flex items-start justify-between px-5 pt-5 pb-2 gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        {isDestructive && (
                            <span className="h-9 w-9 rounded-full bg-red-50 inline-flex items-center justify-center shrink-0">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            </span>
                        )}
                        <h2
                            id="confirm-dialog-title"
                            className="text-[14.5px] font-semibold leading-tight mt-1.5"
                        >
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        aria-label="Close"
                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer shrink-0"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </header>

                {description && (
                    <div
                        className={cn(
                            "px-5 pb-4 text-[12.5px] text-muted-foreground leading-relaxed",
                            isDestructive ? "pl-17" : "",
                        )}
                    >
                        {description}
                    </div>
                )}

                <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
                    <Button
                        type="button"
                        variant="exec-light"
                        onClick={onCancel}
                        disabled={busy}
                        className="h-9 px-3 text-[12.5px] cursor-pointer"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        type="button"
                        variant="exec-dark"
                        onClick={onConfirm}
                        disabled={busy}
                        className={cn(
                            "h-9 px-3 text-[12.5px] cursor-pointer",
                            isDestructive && "bg-red-600 hover:bg-red-700",
                        )}
                    >
                        {busy ? "Working…" : confirmLabel}
                    </Button>
                </footer>
            </div>
        </>,
        document.body,
    );
}
