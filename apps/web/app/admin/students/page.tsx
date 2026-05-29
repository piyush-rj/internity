"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Ban, Search, ShieldCheck } from "lucide-react";
import { PiSealCheckFill } from "react-icons/pi";
import { toast } from "sonner";
import { adminApi, type AdminStudentListItem } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { Button } from "@/src/components/ui/button";
import { PromptDialog } from "@/src/components/ui/PromptDialog";
import { usePrompt } from "@/src/hooks/usePrompt";
import { cn } from "@/src/lib/utils";

export default function AdminStudentsPage() {
    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");
    const [bannedFilter, setBannedFilter] = useState<"" | "true" | "false">("");
    const [verifiedFilter, setVerifiedFilter] = useState<"" | "true" | "false">(
        "",
    );
    const [items, setItems] = useState<AdminStudentListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { prompt, dialogProps: promptDialogProps } = usePrompt();

    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setDebounced(query.trim()), 250);
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [query]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminApi.list_students({
                q: debounced || undefined,
                banned: bannedFilter || undefined,
                verified: verifiedFilter || undefined,
                pageSize: 50,
            });
            setItems(res.items);
            setTotal(res.total);
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't load students.",
            );
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [debounced, bannedFilter, verifiedFilter]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    async function toggleVerified(s: AdminStudentListItem) {
        const next = !s.isVerified;
        // optimistic update so the badge flips immediately
        setItems((prev) =>
            prev.map((x) => (x.id === s.id ? { ...x, isVerified: next } : x)),
        );
        try {
            await adminApi.set_student_verification(s.user.id, {
                verified: next,
            });
            toast.success(
                next ? "Student marked verified." : "Verification removed.",
            );
        } catch (err) {
            // revert on failure
            setItems((prev) =>
                prev.map((x) =>
                    x.id === s.id ? { ...x, isVerified: !next } : x,
                ),
            );
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't update verification.",
            );
        }
    }

    async function toggleBan(s: AdminStudentListItem) {
        const banning = !s.user.isBanned;
        let reason = "";
        if (banning) {
            const value = await prompt({
                title: `Ban ${s.firstName}?`,
                description:
                    "Add a short reason. This is shown to the student and recorded for audit.",
                placeholder: "Why are you banning this account?",
                confirmLabel: "Ban student",
                cancelLabel: "Cancel",
                multiline: true,
                required: true,
                requiredError: "Ban requires a reason.",
                maxLength: 500,
                variant: "destructive",
            });
            if (value === null) return;
            reason = value;
        }
        try {
            await adminApi.set_user_ban(s.user.id, {
                banned: banning,
                reason: banning ? reason.trim() : undefined,
            });
            toast.success(banning ? "Student banned." : "Student unbanned.");
            await load();
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't update ban status.",
            );
        }
    }

    return (
        <section className="px-6 py-6 space-y-4">
            <header className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-[20px] font-semibold tracking-tight">
                        Students
                    </h1>
                    <p className="text-[12.5px] text-muted-foreground">
                        {loading
                            ? "Loading…"
                            : `${total.toLocaleString("en-IN")} students`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={verifiedFilter}
                        onChange={(e) =>
                            setVerifiedFilter(
                                e.target.value as "" | "true" | "false",
                            )
                        }
                        className="h-9 rounded-md border border-border bg-background px-2 text-[12.5px] cursor-pointer"
                    >
                        <option value="">Any verification</option>
                        <option value="true">Verified</option>
                        <option value="false">Unverified</option>
                    </select>
                    <select
                        value={bannedFilter}
                        onChange={(e) =>
                            setBannedFilter(
                                e.target.value as "" | "true" | "false",
                            )
                        }
                        className="h-9 rounded-md border border-border bg-background px-2 text-[12.5px] cursor-pointer"
                    >
                        <option value="">All</option>
                        <option value="false">Active</option>
                        <option value="true">Banned</option>
                    </select>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Name, email, city, college…"
                            className="h-9 rounded-md border border-border bg-background pl-9 pr-3 text-[12.5px] w-72 outline-none focus:border-foreground/40"
                        />
                    </div>
                </div>
            </header>

            {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
                    {error}
                </div>
            )}

            <section className="rounded-lg border border-border bg-card overflow-hidden">
                {items.length === 0 && !loading ? (
                    <div className="px-5 py-12 text-center text-[13px] text-muted-foreground">
                        No students match.
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {items.map((s) => (
                            <li
                                key={s.id}
                                className="px-5 py-3 flex items-center gap-3"
                            >
                                <Avatar
                                    name={
                                        s.user.name ??
                                        `${s.firstName}${s.lastName ? " " + s.lastName : ""}`
                                    }
                                    src={s.user.image}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <a
                                            href={`/student/${s.user.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[13px] font-medium hover:underline truncate"
                                        >
                                            {s.user.name ??
                                                `${s.firstName}${s.lastName ? " " + s.lastName : ""}`}
                                        </a>
                                        {s.isVerified && (
                                            <span
                                                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald-700"
                                                title="Verified by an admin"
                                            >
                                                <PiSealCheckFill className="h-3 w-3" />
                                                Verified
                                            </span>
                                        )}
                                        {s.user.isBanned && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10.5px] text-red-700">
                                                <Ban className="h-3 w-3" />
                                                Banned
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11.5px] text-muted-foreground truncate">
                                        {s.user.email}
                                        {s.city ? ` · ${s.city}` : ""}
                                        {s.college
                                            ? ` · ${s.college}`
                                            : ""} · {s.applicationsCount} apps
                                    </div>
                                    {s.user.isBanned && s.user.banReason && (
                                        <div className="mt-1 text-[11px] text-red-700">
                                            Reason: {s.user.banReason}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="exec-light"
                                    onClick={() => toggleVerified(s)}
                                    className={cn(
                                        "h-8 px-3 text-[11.5px] cursor-pointer",
                                        s.isVerified
                                            ? "text-muted-foreground hover:bg-secondary"
                                            : "text-orange-700 hover:bg-orange-50",
                                    )}
                                    title={
                                        s.isVerified
                                            ? "Remove the verified badge"
                                            : "Mark this student as verified"
                                    }
                                >
                                    <PiSealCheckFill className="h-3.5 w-3.5" />
                                    {s.isVerified ? "Unverify" : "Verify"}
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        s.user.isBanned
                                            ? "exec-light"
                                            : "exec-light"
                                    }
                                    onClick={() => toggleBan(s)}
                                    className={cn(
                                        "h-8 px-3 text-[11.5px] cursor-pointer",
                                        s.user.isBanned &&
                                            "text-emerald-700 hover:bg-emerald-50",
                                        !s.user.isBanned &&
                                            "text-red-700 hover:bg-red-50",
                                    )}
                                >
                                    {s.user.isBanned ? (
                                        <>
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            Unban
                                        </>
                                    ) : (
                                        <>
                                            <Ban className="h-3.5 w-3.5" />
                                            Ban
                                        </>
                                    )}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
            <PromptDialog {...promptDialogProps} />
        </section>
    );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
    if (src) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={src}
                alt={name}
                className="h-9 w-9 rounded-full object-cover ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span className="h-9 w-9 rounded-full inline-flex items-center justify-center bg-secondary text-[12.5px] font-semibold ring-1 ring-border shrink-0">
            {name.trim().charAt(0).toUpperCase()}
        </span>
    );
}
