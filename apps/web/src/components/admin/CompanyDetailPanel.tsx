"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
    AlertTriangle,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    Globe,
    Mail,
    MapPin,
    Phone,
    Users,
    X,
} from "lucide-react";
import { PiLinkedinLogoFill } from "react-icons/pi";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import {
    adminApi,
    companyApi,
    type AdminCompanyDetail,
    type CompanyVerificationStatus,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useConfirm } from "@/src/hooks/useConfirm";
import { cn } from "@/src/lib/utils";

/**
 * Right-side overlay showing a company + founder in full. Per the Slice 1
 * decisions, the only admin actions surfaced here are Approve and Reject.
 * Listing takedowns / account suspensions live on their dedicated section
 * pages (Listings / Founders).
 */
export function CompanyDetailPanel({
    companyId,
    onClose,
    onMutated,
}: {
    companyId: string | null;
    onClose: () => void;
    onMutated: () => void | Promise<void>;
}) {
    const [detail, setDetail] = useState<AdminCompanyDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchDetail = useCallback(async () => {
        if (!companyId) return;
        setLoading(true);
        setErrorMessage(null);
        try {
            const { company } = await companyApi.admin_get(companyId);
            setDetail(company);
        } catch (err) {
            setErrorMessage(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t load company details.",
            );
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        if (!companyId) {
            setDetail(null);
            setErrorMessage(null);
            return;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchDetail();
    }, [companyId, fetchDetail]);

    // Esc to close.
    useEffect(() => {
        if (!companyId) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [companyId, onClose]);

    const open = !!companyId;

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/30 transition-opacity",
                    open ? "opacity-100" : "pointer-events-none opacity-0",
                )}
                onClick={onClose}
                aria-hidden
            />
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Company details"
                className={cn(
                    "fixed top-0 right-0 z-50 h-full w-full sm:w-130",
                    "bg-background border-l border-border shadow-2xl",
                    "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    open ? "translate-x-0" : "translate-x-full",
                    "flex flex-col",
                )}
            >
                <header className="h-13 px-5 border-b border-border flex items-center justify-between shrink-0">
                    <div className="text-[13px] font-medium">
                        Company details
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {loading && !detail ? (
                        <Skeleton />
                    ) : errorMessage ? (
                        <ErrorRow
                            message={errorMessage}
                            onRetry={fetchDetail}
                        />
                    ) : detail ? (
                        <DetailContent
                            detail={detail}
                            onMutated={async () => {
                                await fetchDetail();
                                await onMutated();
                            }}
                        />
                    ) : null}
                </div>
            </aside>
        </>
    );
}

/* ------------------------------ Content body ----------------------------- */

function DetailContent({
    detail,
    onMutated,
}: {
    detail: AdminCompanyDetail;
    onMutated: () => Promise<void>;
}) {
    const owner = detail.members[0];
    const liveListings = detail.listings.filter((l) => !l.closedAt);

    return (
        <div className="px-5 py-5 space-y-5">
            <CompanyHeader detail={detail} />
            {owner?.user.isBanned && owner.user.banReason && (
                <BannedNotice reason={owner.user.banReason} />
            )}
            <StatusActions detail={detail} onMutated={onMutated} />
            {owner && (
                <FounderBanActions
                    user={owner.user}
                    onMutated={onMutated}
                />
            )}
            <Section title="Company">
                <Facts>
                    {detail.foundingYear && (
                        <Fact
                            Icon={Calendar}
                            label="Founded"
                            value={String(detail.foundingYear)}
                        />
                    )}
                    {detail.size && (
                        <Fact Icon={Users} label="Team" value={detail.size} />
                    )}
                    {detail.city && (
                        <Fact
                            Icon={MapPin}
                            label="Location"
                            value={detail.city}
                        />
                    )}
                    {detail.industry && (
                        <Fact
                            Icon={Building2}
                            label="Industry"
                            value={detail.industry}
                        />
                    )}
                </Facts>
                <Links
                    linkedinUrl={detail.linkedinUrl}
                    website={detail.website}
                />
                {detail.about && (
                    <p className="text-[12.5px] leading-relaxed text-foreground/90">
                        {detail.about}
                    </p>
                )}
            </Section>

            {owner && <FounderSection member={owner} />}

            {detail.members.length > 1 && (
                <Section title={`Team (${detail.members.length})`}>
                    <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                        {detail.members.map((m) => (
                            <li
                                key={m.userId}
                                className="px-3 py-2 flex items-center justify-between text-[12.5px]"
                            >
                                <div className="min-w-0">
                                    <div className="font-medium truncate">
                                        {memberName(m) ?? m.user.email ?? "—"}
                                    </div>
                                    <div className="text-[11.5px] text-muted-foreground truncate">
                                        {m.user.email}
                                    </div>
                                </div>
                                <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                                    {m.role}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            <Section
                title={`Listings (${detail._count.listings})`}
                subtitle={
                    liveListings.length > 0
                        ? `${liveListings.length} live`
                        : "No live listings"
                }
            >
                {detail.listings.length === 0 ? (
                    <EmptyHint
                        Icon={Briefcase}
                        text="This company hasn't posted anything yet."
                    />
                ) : (
                    <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                        {detail.listings.map((l) => (
                            <li
                                key={l.id}
                                className="px-3 py-2.5 flex items-start justify-between gap-3"
                            >
                                <div className="min-w-0">
                                    <div className="text-[12.5px] font-medium truncate">
                                        {l.title}
                                    </div>
                                    <div className="text-[11.5px] text-muted-foreground">
                                        {l.type} · {l.mode}
                                        {l.city ? ` · ${l.city}` : ""} ·{" "}
                                        {l._count.applications} applicants
                                    </div>
                                </div>
                                <span
                                    className={cn(
                                        "shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                                        l.closedAt
                                            ? "bg-muted text-muted-foreground"
                                            : "bg-emerald-100 text-emerald-700",
                                    )}
                                >
                                    {l.closedAt ? "Closed" : "Live"}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </Section>
        </div>
    );
}

/* ------------------------------- Sub-views ------------------------------- */

function CompanyHeader({ detail }: { detail: AdminCompanyDetail }) {
    return (
        <div className="flex items-start gap-3">
            <Logo name={detail.name} logoUrl={detail.logoUrl} />
            <div className="min-w-0">
                <h2 className="text-[16px] font-semibold tracking-tight truncate">
                    {detail.name}
                </h2>
                <div className="text-[11.5px] text-muted-foreground">
                    /{detail.slug}
                </div>
                <div className="mt-1.5">
                    <StatusBadge status={detail.verificationStatus} />
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: CompanyVerificationStatus }) {
    const cfg = STATUS_BADGE[status];
    const Icon = cfg.Icon;
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium",
                cfg.classes,
            )}
        >
            <Icon className="h-3 w-3" />
            {cfg.label}
        </span>
    );
}

const STATUS_BADGE: Record<
    CompanyVerificationStatus,
    {
        Icon: typeof CheckCircle2;
        label: string;
        classes: string;
    }
> = {
    PENDING: {
        Icon: Calendar,
        label: "Pending",
        classes: "bg-amber-100 text-amber-800",
    },
    APPROVED: {
        Icon: CheckCircle2,
        label: "Approved",
        classes: "bg-emerald-100 text-emerald-700",
    },
    REJECTED: {
        Icon: AlertTriangle,
        label: "Rejected",
        classes: "bg-red-100 text-red-700",
    },
};

function StatusActions({
    detail,
    onMutated,
}: {
    detail: AdminCompanyDetail;
    onMutated: () => Promise<void>;
}) {
    const [mode, setMode] = useState<"idle" | "rejecting">("idle");
    const [note, setNote] = useState(detail.rejectionNote ?? "");
    const [busy, setBusy] = useState(false);

    // Reset whenever we look at a different company.
    useEffect(() => {
        setMode("idle");
        setNote(detail.rejectionNote ?? "");
    }, [detail.id, detail.rejectionNote]);

    async function approve() {
        setBusy(true);
        try {
            await companyApi.set_verification(detail.id, {
                status: "APPROVED",
            });
            toast.success(`${detail.name} approved`);
            await onMutated();
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t approve.",
            );
        } finally {
            setBusy(false);
        }
    }

    async function reject() {
        const trimmed = note.trim();
        if (!trimmed) {
            toast.error("Add a short note so the founder knows what to fix.");
            return;
        }
        setBusy(true);
        try {
            await companyApi.set_verification(detail.id, {
                status: "REJECTED",
                rejectionNote: trimmed,
            });
            toast.success(`${detail.name} marked as needing updates`);
            await onMutated();
            setMode("idle");
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t reject.",
            );
        } finally {
            setBusy(false);
        }
    }

    if (mode === "rejecting") {
        return (
            <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                <label className="block text-[11.5px] font-medium">
                    Reason (sent to the founder)
                </label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="e.g. Your LinkedIn URL doesn’t lead to a real company page — please update."
                    className={cn(
                        "w-full rounded-md border border-border bg-background px-3 py-2",
                        "text-[12.5px] resize-y focus:outline-none focus:ring-2 focus:ring-brand/30",
                    )}
                />
                <div className="flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="exec-light"
                        onClick={() => setMode("idle")}
                        disabled={busy}
                        className="h-8 px-3 text-[12px] cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="exec-dark"
                        onClick={reject}
                        disabled={busy}
                        className="h-8 px-3 text-[12px] cursor-pointer bg-red-600 hover:bg-red-700"
                    >
                        {busy ? "Sending…" : "Reject with note"}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-end gap-2">
            <Button
                type="button"
                variant="exec-light"
                onClick={() => setMode("rejecting")}
                disabled={busy}
                className="h-9 px-3 text-[12.5px] cursor-pointer text-red-700 hover:bg-red-50"
            >
                Reject
            </Button>
            <Button
                type="button"
                variant="exec-dark"
                onClick={approve}
                disabled={busy}
                className="h-9 px-3 text-[12.5px] cursor-pointer bg-emerald-700 hover:bg-emerald-800"
            >
                {busy
                    ? "Saving…"
                    : detail.verificationStatus === "APPROVED"
                      ? "Re-approve"
                      : "Approve"}
            </Button>
        </div>
    );
}

/**
 * Sticky red banner shown at the top of the panel when the company's primary
 * founder is currently banned, surfacing the reason the admin gave.
 */
function BannedNotice({ reason }: { reason: string }) {
    return (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[12.5px]">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-700" />
            <div className="space-y-1">
                <div className="font-medium text-red-900">
                    Founder account disabled
                </div>
                <p className="text-red-900/90 leading-relaxed">{reason}</p>
            </div>
        </div>
    );
}

/**
 * Deactivate / Reactivate action row. Sits below the approve/reject status
 * actions. Deactivating prompts for a reason via ConfirmDialog and blocks
 * login + hides the founder's listings. Reactivating is one-click.
 */
function FounderBanActions({
    user,
    onMutated,
}: {
    user: AdminCompanyDetail["members"][number]["user"];
    onMutated: () => Promise<void>;
}) {
    const [mode, setMode] = useState<"idle" | "deactivating">("idle");
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const { confirm, dialogProps } = useConfirm();

    // Reset whenever we look at a different founder.
    useEffect(() => {
        setMode("idle");
        setReason("");
    }, [user.id]);

    async function deactivate() {
        const trimmed = reason.trim();
        if (!trimmed) {
            toast.error("Add a short reason so the founder knows why.");
            return;
        }
        const ok = await confirm({
            title: `Disable ${user.name ?? user.email ?? "this founder"}?`,
            description:
                "They'll be signed out and blocked from logging in. All their listings will disappear from public browse until you reactivate them.",
            confirmLabel: "Disable account",
            variant: "destructive",
        });
        if (!ok) return;
        setBusy(true);
        try {
            await adminApi.set_user_ban(user.id, {
                banned: true,
                reason: trimmed,
            });
            toast.success("Account disabled.");
            await onMutated();
            setMode("idle");
            setReason("");
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't disable the account.",
            );
        } finally {
            setBusy(false);
        }
    }

    async function reactivate() {
        const ok = await confirm({
            title: `Reactivate ${user.name ?? user.email ?? "this founder"}?`,
            description:
                "They'll be able to sign in again and their listings will reappear on public browse.",
            confirmLabel: "Reactivate",
        });
        if (!ok) return;
        setBusy(true);
        try {
            await adminApi.set_user_ban(user.id, { banned: false });
            toast.success("Account reactivated.");
            await onMutated();
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't reactivate the account.",
            );
        } finally {
            setBusy(false);
        }
    }

    if (user.isBanned) {
        return (
            <>
                <div className="flex items-center justify-end">
                    <Button
                        type="button"
                        variant="exec-dark"
                        onClick={reactivate}
                        disabled={busy}
                        className="h-9 px-3 text-[12.5px] cursor-pointer bg-emerald-700 hover:bg-emerald-800"
                    >
                        {busy ? "Saving…" : "Reactivate founder"}
                    </Button>
                </div>
                <ConfirmDialog {...dialogProps} />
            </>
        );
    }

    if (mode === "deactivating") {
        return (
            <>
                <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                    <label className="block text-[11.5px] font-medium">
                        Reason (sent to the founder + shown to admins)
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="e.g. Spam listings + fake company details."
                        className={cn(
                            "w-full rounded-md border border-border bg-background px-3 py-2",
                            "text-[12.5px] resize-y focus:outline-none focus:ring-2 focus:ring-brand/30",
                        )}
                    />
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="exec-light"
                            onClick={() => setMode("idle")}
                            disabled={busy}
                            className="h-8 px-3 text-[12px] cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="exec-dark"
                            onClick={deactivate}
                            disabled={busy}
                            className="h-8 px-3 text-[12px] cursor-pointer bg-red-600 hover:bg-red-700"
                        >
                            {busy ? "Disabling…" : "Disable account"}
                        </Button>
                    </div>
                </div>
                <ConfirmDialog {...dialogProps} />
            </>
        );
    }

    return (
        <>
            <div className="flex items-center justify-end">
                <Button
                    type="button"
                    variant="exec-light"
                    onClick={() => setMode("deactivating")}
                    disabled={busy}
                    className="h-9 px-3 text-[12.5px] cursor-pointer text-red-700 hover:bg-red-50"
                >
                    Disable founder account
                </Button>
            </div>
            <ConfirmDialog {...dialogProps} />
        </>
    );
}

function FounderSection({
    member,
}: {
    member: AdminCompanyDetail["members"][number];
}) {
    const ep = member.user.employerProfile;
    const name = memberName(member) ?? member.user.email ?? "(no name)";
    return (
        <Section title="Founder">
            <div className="flex items-start gap-3">
                <Avatar name={name} imageUrl={member.user.image} />
                <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-[13px] font-medium truncate">
                        {name}
                    </div>
                    {ep?.jobTitle && (
                        <div className="text-[11.5px] text-muted-foreground">
                            {ep.jobTitle}
                        </div>
                    )}
                    <ul className="mt-1 space-y-0.5 text-[12px]">
                        {member.user.email && (
                            <ContactRow
                                Icon={Mail}
                                text={member.user.email}
                                href={`mailto:${member.user.email}`}
                            />
                        )}
                        {ep?.phone && (
                            <ContactRow
                                Icon={Phone}
                                text={ep.phone}
                                href={`tel:${ep.phone}`}
                            />
                        )}
                    </ul>
                </div>
            </div>
        </Section>
    );
}

/* ----------------------------- Pure helpers ------------------------------ */

function Section({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-2.5">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {title}
                </h3>
                {subtitle && (
                    <span className="text-[10.5px] text-muted-foreground tabular-nums">
                        {subtitle}
                    </span>
                )}
            </div>
            <div className="space-y-2.5">{children}</div>
        </section>
    );
}

function Facts({ children }: { children: React.ReactNode }) {
    return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
            {children}
        </dl>
    );
}

function Fact({
    Icon,
    label,
    value,
}: {
    Icon: typeof CheckCircle2;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-2 min-w-0">
            <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
                <dt className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    {label}
                </dt>
                <dd className="text-[12.5px] font-medium truncate">{value}</dd>
            </div>
        </div>
    );
}

function Links({
    linkedinUrl,
    website,
}: {
    linkedinUrl: string | null;
    website: string | null;
}) {
    if (!linkedinUrl && !website) return null;
    return (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[12.5px]">
            {linkedinUrl && (
                <li>
                    <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-brand hover:underline"
                    >
                        <PiLinkedinLogoFill className="h-3.5 w-3.5" />
                        LinkedIn
                    </a>
                </li>
            )}
            {website && (
                <li>
                    <a
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-brand hover:underline"
                    >
                        <Globe className="h-3.5 w-3.5" />
                        {prettyUrl(website)}
                    </a>
                </li>
            )}
        </ul>
    );
}

function ContactRow({
    Icon,
    text,
    href,
}: {
    Icon: typeof Mail;
    text: string;
    href?: string;
}) {
    return (
        <li className="flex items-center gap-2 text-foreground/90">
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {href ? (
                <a className="hover:underline truncate" href={href}>
                    {text}
                </a>
            ) : (
                <span className="truncate">{text}</span>
            )}
        </li>
    );
}

function Avatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
    if (imageUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={imageUrl}
                alt={`${name} avatar`}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary text-foreground text-[14px] font-semibold ring-1 ring-border shrink-0">
            {name.charAt(0).toUpperCase()}
        </span>
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

function EmptyHint({ Icon, text }: { Icon: typeof Mail; text: string }) {
    return (
        <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-[12px] text-muted-foreground">
            <Icon className="mx-auto h-4 w-4 mb-1.5" />
            {text}
        </div>
    );
}

function ErrorRow({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    return (
        <div className="px-5 py-6 space-y-2">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
                {message}
            </div>
            <button
                type="button"
                onClick={onRetry}
                className="text-[12px] font-medium text-brand hover:underline cursor-pointer"
            >
                Try again
            </button>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="animate-pulse px-5 py-5 space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-md bg-secondary" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-1/2 rounded-full bg-secondary" />
                    <div className="h-2.5 w-1/3 rounded-full bg-secondary" />
                </div>
            </div>
            <div className="h-20 w-full rounded-lg bg-secondary/60" />
            <div className="h-20 w-full rounded-lg bg-secondary/60" />
        </div>
    );
}

function memberName(m: AdminCompanyDetail["members"][number]): string | null {
    const ep = m.user.employerProfile;
    if (ep?.firstName) {
        return [ep.firstName, ep.lastName].filter(Boolean).join(" ");
    }
    if (m.user.name) return m.user.name;
    return null;
}

function prettyUrl(url: string): string {
    try {
        return new URL(url).host.replace(/^www\./, "");
    } catch {
        return url;
    }
}
