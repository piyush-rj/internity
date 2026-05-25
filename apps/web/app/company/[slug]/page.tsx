"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
    PiArrowSquareOut,
    PiBriefcase,
    PiBuildings,
    PiClock,
    PiCurrencyInr,
    PiMapPin,
    PiUsers,
} from "react-icons/pi";
import { NavBar } from "@/src/components/navbar/NavBar";
import { VerifiedBadge } from "@/src/components/listings/VerifiedBadge";
import { companyApi, type Company, type Listing } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

type CompanyDetail = Company & { listings: Listing[] };

export default function PublicCompanyPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    const [data, setData] = useState<CompanyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiClientError | Error | null>(null);

    useEffect(() => {
        let cancelled = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);

        setError(null);
        companyApi
            .get_by_slug(slug)
            .then(({ company }) => {
                if (!cancelled) setData(company);
            })
            .catch((err) => {
                if (!cancelled)
                    setError(
                        err instanceof Error ? err : new Error(String(err)),
                    );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [slug]);

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-1 pt-14">
                <div className="mx-auto max-w-5xl px-6 py-10">
                    {loading ? (
                        <PageSkeleton />
                    ) : error || !data ? (
                        <NotFound message={error?.message ?? null} />
                    ) : (
                        <CompanyDetailView company={data} />
                    )}
                </div>
            </main>
        </div>
    );
}

function CompanyDetailView({ company }: { company: CompanyDetail }) {
    const openListings = company.listings.filter((l) => !l.closedAt);
    const closedListings = company.listings.filter((l) => l.closedAt);

    return (
        <div className="space-y-8">
            <Hero company={company} />

            <section className="rounded-lg border border-border bg-card overflow-hidden">
                <header className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
                    <div>
                        <h2 className="text-[15px] font-semibold">
                            Open positions
                        </h2>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                            Internships and jobs hiring right now.
                        </p>
                    </div>
                    {openListings.length > 0 && (
                        <span className="text-[11.5px] text-muted-foreground tabular-nums">
                            {openListings.length} open
                        </span>
                    )}
                </header>
                {openListings.length === 0 ? (
                    <div className="px-6 py-12 text-center text-[13px] text-muted-foreground">
                        Not hiring right now. Check back later.
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {openListings.map((listing) => (
                            <li key={listing.id}>
                                <PublicListingRow listing={listing} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {closedListings.length > 0 && (
                <section className="rounded-lg border border-border bg-card overflow-hidden">
                    <header className="px-6 py-4 border-b border-border">
                        <h2 className="text-[14px] font-semibold text-muted-foreground">
                            Recently closed
                        </h2>
                    </header>
                    <ul className="divide-y divide-border">
                        {closedListings.slice(0, 5).map((listing) => (
                            <li key={listing.id}>
                                <PublicListingRow listing={listing} closed />
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}

function Hero({ company }: { company: CompanyDetail }) {
    return (
        <section className="rounded-lg border border-border bg-card p-6 sm:p-8">
            <div className="flex items-start gap-5">
                <Logo name={company.name} logoUrl={company.logoUrl} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-[26px] font-semibold tracking-tight truncate">
                            {company.name}
                        </h1>
                        {company.verificationStatus === "APPROVED" && (
                            <VerifiedBadge size="chip" />
                        )}
                    </div>
                    {(company.industry || company.city) && (
                        <p className="mt-1 text-[13px] text-muted-foreground truncate">
                            {[company.industry, company.city]
                                .filter(Boolean)
                                .join(" · ")}
                        </p>
                    )}
                    {company.about && (
                        <p className="mt-3 text-[13.5px] text-foreground/90 leading-relaxed max-w-prose">
                            {company.about}
                        </p>
                    )}
                    <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px]">
                        {company.size && (
                            <Fact
                                icon={<PiUsers className="h-3.5 w-3.5" />}
                                text={`${company.size} people`}
                            />
                        )}
                        {company.industry && (
                            <Fact
                                icon={<PiBuildings className="h-3.5 w-3.5" />}
                                text={company.industry}
                            />
                        )}
                        {company.city && (
                            <Fact
                                icon={<PiMapPin className="h-3.5 w-3.5" />}
                                text={company.city}
                            />
                        )}
                        {company.website && (
                            <a
                                href={company.website}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline"
                            >
                                {prettyUrl(company.website)}
                                <PiArrowSquareOut className="h-3 w-3" />
                            </a>
                        )}
                    </dl>
                </div>
            </div>
        </section>
    );
}

function PublicListingRow({
    listing,
    closed = false,
}: {
    listing: Listing;
    closed?: boolean;
}) {
    return (
        <Link
            href={`/home/listings/${listing.id}`}
            className="flex items-start gap-4 px-6 py-4 hover:bg-secondary/40 transition-colors"
        >
            <span
                className={cn(
                    "h-9 w-9 rounded-md flex items-center justify-center shrink-0",
                    closed
                        ? "bg-zinc-100 text-zinc-500"
                        : "bg-emerald-50 text-emerald-700",
                )}
            >
                <PiBriefcase className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-medium truncate">
                        {listing.title}
                    </span>
                    <TypeBadge type={listing.type} />
                    <ModeBadge mode={listing.mode} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground">
                    {(listing.stipendMin || listing.stipendMax) && (
                        <span className="inline-flex items-center gap-1 text-foreground font-medium">
                            <PiCurrencyInr className="h-3 w-3" />
                            {formatStipend(
                                listing.stipendMin,
                                listing.stipendMax,
                            )}
                            <span className="text-muted-foreground font-normal">
                                /mo
                            </span>
                        </span>
                    )}
                    {listing.durationMonths && (
                        <span className="inline-flex items-center gap-1">
                            <PiClock className="h-3 w-3" />
                            {listing.durationMonths} months
                        </span>
                    )}
                    {listing.city && (
                        <span className="inline-flex items-center gap-1">
                            <PiMapPin className="h-3 w-3" />
                            {listing.city}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

function Logo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
    if (logoUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={logoUrl}
                alt={`${name} logo`}
                className="h-20 w-20 rounded-lg object-cover bg-white ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span
            className={cn(
                "h-20 w-20 rounded-lg flex items-center justify-center shrink-0",
                "bg-secondary text-foreground text-[28px] font-semibold ring-1 ring-border",
            )}
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function Fact({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-1.5 text-foreground min-w-0">
            <span className="text-muted-foreground inline-flex h-3.5 w-3.5 items-center justify-center">
                {icon}
            </span>
            <span className="truncate">{text}</span>
        </div>
    );
}

function TypeBadge({ type }: { type: Listing["type"] }) {
    return (
        <span className="rounded-md border border-border bg-secondary/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {type === "INTERNSHIP" ? "Internship" : "Job"}
        </span>
    );
}

function ModeBadge({ mode }: { mode: Listing["mode"] }) {
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

function PageSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="rounded-lg border border-border bg-card p-8">
                <div className="flex items-start gap-5">
                    <div className="h-20 w-20 rounded-lg bg-secondary shrink-0" />
                    <div className="flex-1 space-y-3">
                        <div className="h-6 w-1/2 rounded-md bg-secondary" />
                        <div className="h-3 w-1/3 rounded-md bg-secondary" />
                        <div className="h-3 w-2/3 rounded-md bg-secondary" />
                    </div>
                </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-8 h-40" />
        </div>
    );
}

function NotFound({ message }: { message: string | null }) {
    return (
        <div className="rounded-lg border border-border bg-card px-6 py-16 text-center">
            <h1 className="text-[20px] font-semibold">Company not found</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
                {message ??
                    "This company may have moved or the link is incorrect."}
            </p>
            <Link
                href="/"
                className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline"
            >
                Back to home
            </Link>
        </div>
    );
}

function formatStipend(min: number | null, max: number | null): string {
    if (min && max && min !== max)
        return `₹${formatNum(min)}–${formatNum(max)}`;
    const v = max ?? min;
    return v ? `₹${formatNum(v)}` : "—";
}

function formatNum(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return String(n);
}

function prettyUrl(url: string): string {
    try {
        return new URL(url).host.replace(/^www\./, "");
    } catch {
        return url;
    }
}
