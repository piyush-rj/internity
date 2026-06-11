"use client";

import Link from "next/link";
import {
    PiArrowSquareOut,
    PiBookmarkSimple,
    PiBookmarkSimpleFill,
    PiBriefcase,
    PiBuildings,
    PiCalendarBlank,
    PiClock,
    PiCurrencyCircleDollar,
    PiLinkedinLogoFill,
    PiMapPin,
    PiUsers,
} from "react-icons/pi";
import type { ListingDetail as ListingDetailType } from "@/src/hooks/useListing";
import { ApplyCard } from "@/src/components/listings/ApplyCard";
import { ShareMenu } from "@/src/components/listings/ShareMenu";
import { ReportListingButton } from "@/src/components/listings/ReportListingButton";
import { VerifiedBadge } from "@/src/components/listings/VerifiedBadge";
import { useIsSaved, useSavedStore } from "@/src/store/useSavedStore";
import { formatDuration } from "@/src/lib/format/duration";
import { formatListingTitle } from "@/src/lib/listingTitle";
import { formatStipend } from "@/src/lib/catalog/currencies";
import { cn } from "@/src/lib/utils";

export function ListingDetail({
    listing,
    applied,
    onApplied,
}: {
    listing: ListingDetailType;
    applied: boolean;
    onApplied: () => Promise<void> | void;
}) {
    const closed = !!listing.closedAt;
    const durationLabel = formatDuration(
        listing.durationMonths,
        listing.durationWeeks,
    );
    const hasKeyDetails = !!(
        listing.applyBy ||
        listing.startDate ||
        durationLabel ||
        listing.stipendMin ||
        listing.stipendMax ||
        listing.openings
    );

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
            <Header listing={listing} closed={closed} />

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                <article className="space-y-6 min-w-0 order-2 lg:order-1">
                    <Section title="About the role">
                        <Prose text={listing.description} />
                    </Section>

                    {listing.responsibilities.length > 0 && (
                        <Section title="What you’ll do">
                            <BulletList items={listing.responsibilities} />
                        </Section>
                    )}

                    {listing.preferences.length > 0 && (
                        <Section title="Who can apply">
                            <BulletList items={listing.preferences} />
                        </Section>
                    )}

                    {listing.perks.length > 0 && (
                        <Section title="Perks">
                            <BulletList items={listing.perks} />
                        </Section>
                    )}

                    {listing.skillTagsRaw.length > 0 && (
                        <Section title="Skills">
                            <div className="flex flex-wrap gap-1.5">
                                {listing.skillTagsRaw.map((skill) => (
                                    <span
                                        key={skill}
                                        className="rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-[12px]"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </Section>
                    )}
                </article>

                <aside className="order-1 lg:order-2 lg:sticky lg:top-16 lg:self-start space-y-4">
                    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                        {hasKeyDetails && <KeyDetails listing={listing} />}
                        <div className={hasKeyDetails ? "pt-3" : ""}>
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <ShareMenu
                                    url={`/listings/${listing.id}`}
                                    title={formatListingTitle(listing.title)}
                                    company={listing.company.name}
                                    listing={{
                                        mode: listing.mode,
                                        city: listing.city,
                                        durationMonths: listing.durationMonths,
                                        durationWeeks: listing.durationWeeks,
                                        stipendMin: listing.stipendMin,
                                        stipendMax: listing.stipendMax,
                                        currency: listing.currency,
                                        skillTagsRaw: listing.skillTagsRaw,
                                    }}
                                />
                                <ReportListingButton listingId={listing.id} />
                            </div>
                            <ApplyCard
                                listingId={listing.id}
                                postedById={listing.postedById}
                                closed={closed}
                                applied={applied}
                                screeningQuestions={listing.screeningQuestions}
                                onApplied={onApplied}
                            />
                        </div>
                    </div>

                    <PostedByCard
                        postedBy={listing.postedBy}
                        company={listing.company}
                    />
                </aside>
            </div>
        </div>
    );
}

function PostedByCard({
    postedBy,
    company,
}: {
    postedBy: ListingDetailType["postedBy"] | null | undefined;
    company: ListingDetailType["company"];
}) {
    if (!postedBy) return null;
    const ep = postedBy.employerProfile;
    const founderName =
        (ep
            ? `${ep.firstName}${ep.lastName ? " " + ep.lastName : ""}`.trim()
            : null) ??
        postedBy.name ??
        null;
    if (!founderName) return null;

    return (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Posted by
            </div>
            <div className="flex items-start gap-3">
                <FounderAvatar
                    name={founderName}
                    imageUrl={postedBy.image ?? null}
                />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[13px] font-medium truncate">
                            {founderName}
                        </span>
                        {ep?.linkedinUrl && (
                            <a
                                href={ep.linkedinUrl}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`${founderName} on LinkedIn`}
                                className="text-[#0a66c2] hover:text-[#0a66c2]/80 shrink-0"
                            >
                                <PiLinkedinLogoFill className="h-3.5 w-3.5" />
                            </a>
                        )}
                    </div>
                    {ep?.jobTitle && (
                        <div className="text-[11.5px] text-muted-foreground truncate">
                            {ep.jobTitle} at {company.name}
                        </div>
                    )}
                </div>
            </div>
            <Link
                href={`/company/${company.slug}`}
                className={cn(
                    "flex items-center justify-between gap-2 mt-1 pt-3 border-t border-border",
                    "text-[12.5px] font-medium text-foreground/80 hover:text-orange-600 transition-colors",
                )}
            >
                <span className="inline-flex items-center gap-1.5 min-w-0">
                    <PiBuildings className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">View {company.name}</span>
                </span>
                <PiArrowSquareOut className="h-3 w-3 shrink-0 text-muted-foreground" />
            </Link>
        </div>
    );
}

function FounderAvatar({
    name,
    imageUrl,
}: {
    name: string;
    imageUrl: string | null;
}) {
    if (imageUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={imageUrl}
                alt={`${name} avatar`}
                className="h-9 w-9 rounded-full object-cover ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span className="h-9 w-9 rounded-full flex items-center justify-center bg-linear-to-br from-orange-400 to-orange-600 text-white text-[13px] font-semibold ring-1 ring-border shrink-0">
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function ListingStatusBadge({
    closed,
    takenDown,
    paused,
    expired,
}: {
    closed: boolean;
    takenDown: boolean;
    paused: boolean;
    expired: boolean;
}) {
    if (takenDown) {
        return (
            <span className="rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                Taken Down
            </span>
        );
    }
    if (expired) {
        return (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                Expired
            </span>
        );
    }
    if (paused) {
        return (
            <span className="rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                Paused
            </span>
        );
    }
    return (
        <span
            className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                closed
                    ? "bg-zinc-100 text-zinc-700 border-zinc-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200",
            )}
        >
            {closed ? "Closed" : "Open"}
        </span>
    );
}

function Header({
    listing,
    closed,
}: {
    listing: ListingDetailType;
    closed: boolean;
}) {
    const takenDown = !!listing.takenDownAt;
    const paused = !!listing.pausedAt;
    const expired = listing.expiresAt
        ? new Date(listing.expiresAt).getTime() <= Date.now()
        : false;
    const durationLabel = formatDuration(
        listing.durationMonths,
        listing.durationWeeks,
    );
    return (
        <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
                <CompanyAvatar
                    name={listing.company.name}
                    logoUrl={listing.company.logoUrl}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-[18px] sm:text-[22px] font-semibold tracking-tight">
                            {formatListingTitle(listing.title)}
                        </h1>
                        <ModeBadge mode={listing.mode} />
                        <ListingStatusBadge
                            closed={closed}
                            takenDown={takenDown}
                            paused={paused}
                            expired={expired}
                        />
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
                        <span>{listing.company.name}</span>
                        {listing.company.verificationStatus === "APPROVED" && (
                            <VerifiedBadge label />
                        )}
                        {listing.city && <span>· {listing.city}</span>}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground">
                        <Meta
                            icon={<PiBriefcase className="h-3.5 w-3.5" />}
                            text="Internship"
                        />
                        {(listing.stipendMin || listing.stipendMax) && (
                            <Meta
                                icon={
                                    <PiCurrencyCircleDollar className="h-3.5 w-3.5" />
                                }
                                text={`${formatStipend(listing.stipendMin, listing.stipendMax, listing.currency)}/mo`}
                            />
                        )}
                        {durationLabel && (
                            <Meta
                                icon={<PiClock className="h-3.5 w-3.5" />}
                                text={durationLabel}
                            />
                        )}
                        {listing.city && (
                            <Meta
                                icon={<PiMapPin className="h-3.5 w-3.5" />}
                                text={listing.city}
                            />
                        )}
                    </div>
                </div>
                <SaveToggle listing={listing} />
            </div>
        </section>
    );
}

function SaveToggle({ listing }: { listing: ListingDetailType }) {
    const saved = useIsSaved(listing.id);
    const toggle = useSavedStore((s) => s.toggle);
    const Icon = saved ? PiBookmarkSimpleFill : PiBookmarkSimple;
    return (
        <button
            type="button"
            onClick={() => toggle(listing)}
            aria-pressed={saved}
            aria-label={saved ? "Unsave" : "Save"}
            className={cn(
                "h-9 w-9 inline-flex items-center justify-center rounded-md shrink-0",
                "transition-colors",
                saved
                    ? "text-brand hover:bg-brand/10"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
        >
            <Icon className="h-5 w-5" />
        </button>
    );
}

function KeyDetails({ listing }: { listing: ListingDetailType }) {
    const durationLabel = formatDuration(
        listing.durationMonths,
        listing.durationWeeks,
    );
    return (
        <dl className="grid grid-cols-1 gap-y-2 text-[12.5px]">
            {listing.applyBy && (
                <Row
                    icon={<PiCalendarBlank className="h-3.5 w-3.5" />}
                    label="Apply by"
                    value={formatDate(listing.applyBy)}
                />
            )}
            {listing.startDate && (
                <Row
                    icon={<PiCalendarBlank className="h-3.5 w-3.5" />}
                    label="Start date"
                    value={formatDate(listing.startDate)}
                />
            )}
            {durationLabel && (
                <Row
                    icon={<PiClock className="h-3.5 w-3.5" />}
                    label="Duration"
                    value={durationLabel}
                />
            )}
            {(listing.stipendMin || listing.stipendMax) && (
                <Row
                    icon={<PiCurrencyCircleDollar className="h-3.5 w-3.5" />}
                    label="Stipend"
                    value={`${formatStipend(listing.stipendMin, listing.stipendMax, listing.currency)}/mo`}
                />
            )}
            {listing.openings && (
                <Row
                    icon={<PiUsers className="h-3.5 w-3.5" />}
                    label="Openings"
                    value={String(listing.openings)}
                />
            )}
        </dl>
    );
}

function Row({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-muted-foreground inline-flex h-3.5 w-3.5 items-center justify-center">
                    {icon}
                </span>
                {label}
            </dt>
            <dd className="font-medium text-foreground truncate">{value}</dd>
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
        <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-[14px] font-semibold tracking-tight">
                {title}
            </h2>
            <div className="mt-3 text-[13.5px] text-foreground/90">
                {children}
            </div>
        </section>
    );
}

function Prose({ text }: { text: string }) {
    return <div className="whitespace-pre-wrap leading-relaxed">{text}</div>;
}

function BulletList({ items }: { items: string[] }) {
    return (
        <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
            {items.map((it, i) => (
                <li key={i}>{it}</li>
            ))}
        </ul>
    );
}

function Meta({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <span className="inline-flex items-center gap-1">
            {icon}
            {text}
        </span>
    );
}

function CompanyAvatar({
    name,
    logoUrl,
}: {
    name: string;
    logoUrl: string | null;
}) {
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
        <span
            className={cn(
                "h-12 w-12 rounded-md flex items-center justify-center shrink-0",
                "bg-secondary text-foreground text-[16px] font-semibold ring-1 ring-border",
            )}
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function ModeBadge({ mode }: { mode: ListingDetailType["mode"] }) {
    const styles: Record<typeof mode, string> = {
        REMOTE: "bg-emerald-50 text-emerald-700 border-emerald-200",
        HYBRID: "bg-amber-50 text-amber-700 border-amber-200",
        ONSITE: "bg-zinc-100 text-zinc-700 border-zinc-200",
    };
    const labels: Record<typeof mode, string> = {
        REMOTE: "Remote",
        HYBRID: "Hybrid",
        ONSITE: "On-site",
    };
    return (
        <span
            className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                styles[mode],
            )}
        >
            {labels[mode]}
        </span>
    );
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return iso.slice(0, 10);
    }
}
