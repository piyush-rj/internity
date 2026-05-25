"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
    AlertTriangle,
    ArrowUpRight,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    MapPin,
    Users,
    X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { listingApi, type AdminListingListItem } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

/**
 * Right-side overlay for a single admin-side listing. Lets admin take it
 * down (with a required reason) or restore it. Mirrors the visual language
 * of CompanyDetailPanel.
 */
export function ListingDetailPanel({
    listing,
    onClose,
    onMutated,
}: {
    listing: AdminListingListItem | null;
    onClose: () => void;
    onMutated: () => void | Promise<void>;
}) {
    const open = !!listing;

    // Esc to close.
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

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
                aria-label="Listing details"
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
                        Listing details
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
                    {listing && (
                        <DetailContent
                            listing={listing}
                            onMutated={onMutated}
                        />
                    )}
                </div>
            </aside>
        </>
    );
}

function DetailContent({
    listing,
    onMutated,
}: {
    listing: AdminListingListItem;
    onMutated: () => Promise<void> | void;
}) {
    return (
        <div className="px-5 py-5 space-y-5">
            <ListingHeader listing={listing} />
            <ModerationActions listing={listing} onMutated={onMutated} />
            {listing.takenDownAt && listing.takedownReason && (
                <TakedownBanner reason={listing.takedownReason} />
            )}
            <Section title="Snapshot">
                <Facts>
                    <Fact
                        Icon={Briefcase}
                        label="Type"
                        value={`${listing.type} · ${listing.mode}`}
                    />
                    {listing.city && (
                        <Fact
                            Icon={MapPin}
                            label="Location"
                            value={listing.city}
                        />
                    )}
                    {listing.applyBy && (
                        <Fact
                            Icon={Calendar}
                            label="Apply by"
                            value={formatDate(listing.applyBy)}
                        />
                    )}
                    <Fact
                        Icon={Users}
                        label="Applicants"
                        value={String(listing._count.applications)}
                    />
                </Facts>
            </Section>

            {listing.skillTagsRaw.length > 0 && (
                <Section title="Skills">
                    <div className="flex flex-wrap gap-1.5">
                        {listing.skillTagsRaw.map((t) => (
                            <span
                                key={t}
                                className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] text-foreground"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </Section>
            )}

            <Section title="Description">
                <p className="text-[12.5px] leading-relaxed whitespace-pre-line text-foreground/90">
                    {listing.description}
                </p>
            </Section>

            {listing.screeningQuestions.length > 0 && (
                <Section title="Screening questions">
                    <ol className="space-y-1.5 text-[12.5px] text-foreground/90 list-decimal pl-5 marker:text-muted-foreground marker:tabular-nums">
                        {listing.screeningQuestions.map((q, i) => (
                            <li key={i}>{q}</li>
                        ))}
                    </ol>
                </Section>
            )}

            <Section title="Founder">
                <div className="text-[12.5px]">
                    <div className="font-medium">
                        {listing.postedBy.name ?? listing.postedBy.email ?? "—"}
                    </div>
                    {listing.postedBy.email && (
                        <a
                            href={`mailto:${listing.postedBy.email}`}
                            className="text-[11.5px] text-muted-foreground hover:underline"
                        >
                            {listing.postedBy.email}
                        </a>
                    )}
                </div>
            </Section>
        </div>
    );
}

function ListingHeader({ listing }: { listing: AdminListingListItem }) {
    return (
        <div className="flex items-start gap-3">
            <Logo
                name={listing.company.name}
                logoUrl={listing.company.logoUrl}
            />
            <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-semibold tracking-tight">
                    {listing.title}
                </h2>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground truncate">
                    {listing.company.name}
                </div>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <StateBadge listing={listing} />
                    <Link
                        href={`/home/listings/${listing.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                        View public page
                        <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

function StateBadge({ listing }: { listing: AdminListingListItem }) {
    if (listing.takenDownAt) {
        return (
            <Badge
                Icon={AlertTriangle}
                label="Taken down"
                classes="bg-red-100 text-red-700"
            />
        );
    }
    if (listing.closedAt) {
        return (
            <Badge
                Icon={Clock}
                label="Closed"
                classes="bg-muted text-muted-foreground"
            />
        );
    }
    return (
        <Badge
            Icon={CheckCircle2}
            label="Live"
            classes="bg-emerald-100 text-emerald-700"
        />
    );
}

function Badge({
    Icon,
    label,
    classes,
}: {
    Icon: typeof CheckCircle2;
    label: string;
    classes: string;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium",
                classes,
            )}
        >
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
}

function ModerationActions({
    listing,
    onMutated,
}: {
    listing: AdminListingListItem;
    onMutated: () => Promise<void> | void;
}) {
    const [mode, setMode] = useState<"idle" | "taking-down">("idle");
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);

    // Reset state whenever the focused listing changes.
    useEffect(() => {
        setMode("idle");
        setReason("");
    }, [listing.id]);

    const takenDown = !!listing.takenDownAt;

    async function takeDown() {
        const trimmed = reason.trim();
        if (!trimmed) {
            toast.error("Add a short reason so the founder knows what to fix.");
            return;
        }
        setBusy(true);
        try {
            await listingApi.admin_take_down(listing.id, trimmed);
            toast.success("Listing taken down — founder has been notified.");
            await onMutated();
            setMode("idle");
            setReason("");
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t take down listing.",
            );
        } finally {
            setBusy(false);
        }
    }

    async function restore() {
        setBusy(true);
        try {
            await listingApi.admin_restore(listing.id);
            toast.success("Listing restored.");
            await onMutated();
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t restore listing.",
            );
        } finally {
            setBusy(false);
        }
    }

    if (takenDown) {
        return (
            <div className="flex items-center justify-end">
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={restore}
                    disabled={busy}
                    className="h-9 px-3 text-[12.5px] cursor-pointer bg-emerald-700 hover:bg-emerald-800"
                >
                    {busy ? "Saving…" : "Restore listing"}
                </Button>
            </div>
        );
    }

    if (mode === "taking-down") {
        return (
            <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                <label className="block text-[11.5px] font-medium">
                    Reason (sent to the founder)
                </label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="e.g. This listing looks like spam — no real role described."
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
                        onClick={takeDown}
                        disabled={busy}
                        className="h-8 px-3 text-[12px] cursor-pointer bg-red-600 hover:bg-red-700"
                    >
                        {busy ? "Removing…" : "Take down"}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-end">
            <Button
                type="button"
                variant="exec-light"
                onClick={() => setMode("taking-down")}
                disabled={busy}
                className="h-9 px-3 text-[12.5px] cursor-pointer text-red-700 hover:bg-red-50"
            >
                Take down
            </Button>
        </div>
    );
}

function TakedownBanner({ reason }: { reason: string }) {
    return (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[12.5px]">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-700" />
            <div className="space-y-1">
                <div className="font-medium text-red-900">
                    Removed from the public site
                </div>
                <p className="text-red-900/90 leading-relaxed">{reason}</p>
            </div>
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
            </h3>
            <div className="space-y-2">{children}</div>
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

function Logo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
    if (logoUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={logoUrl}
                alt={`${name} logo`}
                className="h-10 w-10 rounded-md object-cover bg-white ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span className="h-10 w-10 rounded-md flex items-center justify-center bg-secondary text-foreground text-[14px] font-semibold ring-1 ring-border shrink-0">
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}
