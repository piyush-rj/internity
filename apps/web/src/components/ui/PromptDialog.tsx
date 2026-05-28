"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export type PromptDialogProps = {
    open: boolean;
    title: string;
    description?: string;
    placeholder?: string;
    defaultValue?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    multiline?: boolean;
    required?: boolean;
    requiredError?: string;
    maxLength?: number;
    variant?: "default" | "destructive";
    busy?: boolean;
    onCancel: () => void;
    onConfirm: (value: string) => void | Promise<void>;
};

// centered modal that asks for a single string input, the in-app
// replacement for window.prompt(...)
export function PromptDialog({
    open,
    title,
    description,
    placeholder,
    defaultValue = "",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    multiline = false,
    required = false,
    requiredError = "This field is required.",
    maxLength,
    variant = "default",
    busy = false,
    onCancel,
    onConfirm,
}: PromptDialogProps) {
    const [value, setValue] = useState(defaultValue);
    const [touched, setTouched] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(
        null,
    );

    // reset when the dialog opens (or the default changes between opens)
    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setValue(defaultValue);
            setTouched(false);
            // focus after the portal mounts
            const t = setTimeout(() => inputRef.current?.focus(), 0);
            return () => clearTimeout(t);
        }
    }, [open, defaultValue]);

    const trimmed = value.trim();
    const showError = touched && required && !trimmed;

    function attemptSubmit() {
        if (busy) return;
        if (required && !trimmed) {
            setTouched(true);
            return;
        }
        void onConfirm(trimmed);
    }

    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && !busy) onCancel();
            // For single-line, plain Enter submits. For multiline, only
            // Cmd/Ctrl+Enter submits so users can type newlines naturally.
            if (e.key === "Enter" && !busy) {
                if (multiline && !(e.metaKey || e.ctrlKey)) return;
                e.preventDefault();
                attemptSubmit();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, busy, multiline, value, required]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!open || !mounted) return null;

    const isDestructive = variant === "destructive";

    const inputCls = cn(
        "w-full rounded-md border border-input bg-background px-3 py-2",
        "text-[13px] outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
        showError && "border-red-300 focus:border-red-400 focus:ring-red-100",
    );

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-100 bg-black/30"
                onClick={() => !busy && onCancel()}
                aria-hidden
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="prompt-dialog-title"
                className={cn(
                    "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-101",
                    "w-full max-w-md mx-4 rounded-lg border border-border bg-background shadow-2xl",
                    "flex flex-col",
                )}
            >
                <header className="flex items-start justify-between px-5 pt-5 pb-2 gap-3">
                    <h2
                        id="prompt-dialog-title"
                        className="text-[14.5px] font-semibold leading-tight mt-1.5 min-w-0"
                    >
                        {title}
                    </h2>
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

                <div className="px-5 pb-4 space-y-2">
                    {description && (
                        <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                            {description}
                        </p>
                    )}
                    {multiline ? (
                        <textarea
                            ref={(el) => {
                                inputRef.current = el;
                            }}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onBlur={() => setTouched(true)}
                            placeholder={placeholder}
                            rows={3}
                            maxLength={maxLength}
                            disabled={busy}
                            className={cn(inputCls, "min-h-20 resize-y")}
                        />
                    ) : (
                        <input
                            ref={(el) => {
                                inputRef.current = el;
                            }}
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onBlur={() => setTouched(true)}
                            placeholder={placeholder}
                            maxLength={maxLength}
                            disabled={busy}
                            className={inputCls}
                        />
                    )}
                    {showError && (
                        <p className="text-[11.5px] text-red-600">
                            {requiredError}
                        </p>
                    )}
                    {maxLength && (
                        <div className="text-right text-[11px] text-muted-foreground tabular-nums">
                            {value.length}/{maxLength}
                        </div>
                    )}
                </div>

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
                        onClick={attemptSubmit}
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
