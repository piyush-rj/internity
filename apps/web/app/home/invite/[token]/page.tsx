"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { invitationApi, type InvitationLookup } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { displayCompanyRole } from "@/src/lib/catalog/companyRoles";
import { useMeStore } from "@/src/store/useMeStore";
import { cn } from "@/src/lib/utils";

export default function InviteAcceptPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = use(params);
    const router = useRouter();
    const me = useMeStore((s) => s.me);
    const [data, setData] = useState<InvitationLookup | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [accepting, setAccepting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await invitationApi.get(token);
            setData(res);
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't load this invite.",
            );
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    async function accept() {
        if (accepting) return;
        setAccepting(true);
        try {
            await invitationApi.accept(token);
            toast.success(
                `You're in! Welcome to ${data?.invitation.company.name}.`,
            );
            router.push("/home/company");
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't join. Try again.",
            );
            setAccepting(false);
        }
    }

    return (
        <div className="mx-auto max-w-lg px-6 py-12">
            <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                {loading ? (
                    <Skeleton />
                ) : error ? (
                    <ErrorState message={error} />
                ) : data ? (
                    <Content
                        data={data}
                        callerEmail={me?.email ?? null}
                        onAccept={accept}
                        accepting={accepting}
                    />
                ) : null}
            </section>
        </div>
    );
}

function Content({
    data,
    callerEmail,
    onAccept,
    accepting,
}: {
    data: InvitationLookup;
    callerEmail: string | null;
    onAccept: () => void;
    accepting: boolean;
}) {
    const inv = data.invitation;
    const emailMatches =
        !!callerEmail && callerEmail.toLowerCase() === inv.email.toLowerCase();

    return (
        <>
            <header className="px-6 py-5 border-b border-border flex items-start gap-4">
                <Logo name={inv.company.name} logoUrl={inv.company.logoUrl} />
                <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        You&apos;ve been invited
                    </div>
                    <h1 className="mt-0.5 text-[20px] font-semibold tracking-tight truncate">
                        Join {inv.company.name}
                    </h1>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        as a{" "}
                        <span className="font-medium text-foreground/90">
                            {displayCompanyRole(inv.role, inv.customRole)}
                        </span>
                    </p>
                </div>
            </header>

            <div className="px-6 py-5 space-y-4">
                <Fact
                    label="Invited by"
                    value={
                        inv.invitedBy.name ??
                        inv.invitedBy.email ??
                        "A teammate"
                    }
                />
                <Fact label="Sent to" value={inv.email} />

                {data.state === "accepted" ? (
                    <Notice
                        tone="emerald"
                        icon={<Check className="h-4 w-4" />}
                        title="Already accepted"
                        body="This invite has already been used. Open your Company page to continue."
                    />
                ) : data.state === "expired" ? (
                    <Notice
                        tone="amber"
                        icon={<AlertTriangle className="h-4 w-4" />}
                        title="Invite expired"
                        body="Ask the founder to send you a fresh invite."
                    />
                ) : !emailMatches ? (
                    <Notice
                        tone="amber"
                        icon={<AlertTriangle className="h-4 w-4" />}
                        title="Wrong account"
                        body={`This invite was sent to ${inv.email}, but you're signed in as ${callerEmail ?? "another account"}. Sign in with the invited email to accept.`}
                    />
                ) : null}
            </div>

            <footer className="px-6 py-4 border-t border-border bg-secondary/30 flex items-center justify-end gap-2">
                <Link
                    href="/home/dashboard"
                    className={cn(
                        "inline-flex items-center h-9 px-4 rounded-md text-[12.5px] font-medium",
                        "border border-border bg-background text-foreground hover:bg-secondary",
                    )}
                >
                    Not now
                </Link>
                {data.state === "pending" && emailMatches && (
                    <Button
                        type="button"
                        variant="exec-dark"
                        onClick={onAccept}
                        disabled={accepting}
                        className="h-9 px-4 text-[12.5px] rounded-md cursor-pointer"
                    >
                        {accepting ? "Joining…" : `Accept & join`}
                    </Button>
                )}
                {data.state === "accepted" && (
                    <Link
                        href="/home/company"
                        className={cn(
                            "inline-flex items-center h-9 px-4 rounded-md text-[12.5px] font-medium text-white",
                            "bg-orange-500 hover:bg-orange-600",
                        )}
                    >
                        Open Company
                    </Link>
                )}
            </footer>
        </>
    );
}

function Logo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
    if (logoUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={logoUrl}
                alt={`${name} logo`}
                className="h-12 w-12 rounded-md object-cover bg-white ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span className="h-12 w-12 rounded-md flex items-center justify-center bg-secondary text-foreground text-[18px] font-semibold ring-1 ring-border shrink-0">
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function Fact({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium truncate max-w-[60%]">{value}</span>
        </div>
    );
}

function Notice({
    tone,
    icon,
    title,
    body,
}: {
    tone: "emerald" | "amber";
    icon: React.ReactNode;
    title: string;
    body: string;
}) {
    const styles =
        tone === "emerald"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-900";
    return (
        <div
            className={cn(
                "rounded-lg border px-3 py-2.5 flex items-start gap-2",
                styles,
            )}
        >
            <span className="mt-0.5 shrink-0">{icon}</span>
            <div className="text-[12.5px]">
                <div className="font-medium">{title}</div>
                <p className="mt-0.5 leading-relaxed">{body}</p>
            </div>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="p-6 animate-pulse space-y-4">
            <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-md bg-secondary shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded-full bg-secondary" />
                    <div className="h-5 w-2/3 rounded-md bg-secondary" />
                </div>
            </div>
            <div className="h-20 rounded-lg bg-secondary" />
        </div>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <div className="p-6 space-y-3">
            <div className="inline-flex items-center gap-2 text-rose-700">
                <X className="h-4 w-4" />
                <span className="font-medium text-[14px]">
                    Invite not available
                </span>
            </div>
            <p className="text-[13px] text-muted-foreground">{message}</p>
            <Link
                href="/home/dashboard"
                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-orange-600 hover:underline"
            >
                Back to dashboard
                <ArrowRight className="h-3.5 w-3.5" />
            </Link>
        </div>
    );
}
