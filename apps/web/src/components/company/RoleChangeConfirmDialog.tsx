"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ShieldCheck, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
    COMPANY_ROLE_HINT,
    COMPANY_ROLE_LABEL,
} from "@/src/lib/catalog/companyRoles";
import type { CompanyRole } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

// Inline confirmation modal shown before a member's CompanyRole is changed.
// Surfaces the old → new transition plus a one-line summary of the new
// role's permissions so the owner can't accidentally hand someone admin
// rights they didn't mean to. The confirm button uses the brand color.
export function RoleChangeConfirmDialog({
    open,
    memberName,
    memberEmail,
    currentRole,
    nextRole,
    busy = false,
    onCancel,
    onConfirm,
}: {
    open: boolean;
    memberName: string;
    memberEmail: string | null;
    currentRole: CompanyRole;
    nextRole: CompanyRole;
    busy?: boolean;
    onCancel: () => void;
    onConfirm: () => void | Promise<void>;
}) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && !busy) onCancel();
            if (e.key === "Enter" && !busy) onConfirm();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, busy, onCancel, onConfirm]);

    if (!open || !mounted) return null;

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-100 bg-black/40"
                onClick={() => !busy && onCancel()}
                aria-hidden
            />
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="role-change-title"
                className={cn(
                    "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-101",
                    "w-full max-w-md mx-4 rounded-lg border border-border bg-background shadow-2xl",
                    "flex flex-col",
                )}
            >
                <header className="flex items-center justify-between px-5 h-13 border-b border-border">
                    <h2
                        id="role-change-title"
                        className="text-[14.5px] font-semibold inline-flex items-center gap-2"
                    >
                        <ShieldCheck className="h-4 w-4 text-brand" />
                        Confirm role change
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        aria-label="Close"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="px-5 py-4 space-y-4">
                    <p className="text-[13px] text-foreground/90 leading-relaxed">
                        You&rsquo;re changing the role of{" "}
                        <span className="font-semibold">{memberName}</span>
                        {memberEmail && (
                            <>
                                {" "}
                                <span className="text-muted-foreground">
                                    ({memberEmail})
                                </span>
                            </>
                        )}
                        .
                    </p>

                    <div className="rounded-lg border border-border bg-secondary/30 p-3">
                        <div className="flex items-center gap-3 text-[13px]">
                            <RolePill role={currentRole} />
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <RolePill role={nextRole} highlight />
                        </div>
                        <p className="mt-2.5 text-[11.5px] text-muted-foreground leading-relaxed">
                            {COMPANY_ROLE_HINT[nextRole]}
                        </p>
                    </div>

                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                        Their permissions update immediately. You can change
                        this back at any time.
                    </p>
                </div>

                <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
                    <Button
                        type="button"
                        variant="exec-light"
                        onClick={onCancel}
                        disabled={busy}
                        className="h-9 px-3.5 text-[12.5px] cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className={cn(
                            "h-9 px-3.5 text-[12.5px] cursor-pointer",
                            "bg-orange-500 text-white hover:bg-orange-600",
                            "shadow-sm shadow-orange-500/20",
                        )}
                    >
                        {busy ? "Updating…" : "Update role"}
                    </Button>
                </footer>
            </div>
        </>,
        document.body,
    );
}

function RolePill({
    role,
    highlight,
}: {
    role: CompanyRole;
    highlight?: boolean;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium",
                highlight
                    ? "border-orange-300 bg-orange-50 text-orange-700"
                    : "border-border bg-background text-foreground/80",
            )}
        >
            {COMPANY_ROLE_LABEL[role]}
        </span>
    );
}
