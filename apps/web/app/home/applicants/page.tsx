"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ApplicantCard } from "@/src/components/applicants/ApplicantCard";
import { useListingApplicants } from "@/src/hooks/useListingApplicants";
import { useMyListings } from "@/src/hooks/useMyListings";
import type { ApplicantWithStudent } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

type SortKey =
    | "applied_desc"
    | "applied_asc"
    | "name_asc"
    | "college_asc"
    | "match_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "applied_desc", label: "Most recent" },
    { value: "applied_asc", label: "Oldest" },
    { value: "match_desc", label: "Best skill match" },
    { value: "name_asc", label: "Name (A–Z)" },
    { value: "college_asc", label: "College (A–Z)" },
];

export default function ApplicantsPage() {
    return (
        <Suspense fallback={<SectionSkeleton />}>
            <ApplicantsView />
        </Suspense>
    );
}

function ApplicantsView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queriedId = searchParams?.get("listingId") ?? null;

    const { items: listings, loading: listingsLoading } = useMyListings();

    // Resolve which listing's applicants to show. Prefer the URL param if
    // valid, otherwise default to the first listing.
    const activeListingId = useMemo(() => {
        if (listings.length === 0) return null;
        if (queriedId && listings.some((l) => l.id === queriedId))
            return queriedId;
        return listings[0]?.id ?? null;
    }, [listings, queriedId]);

    // Keep the URL in sync with the resolved choice so back-nav works as
    // expected and shareable links land on the right listing.
    useEffect(() => {
        if (!activeListingId) return;
        if (queriedId === activeListingId) return;
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        params.set("listingId", activeListingId);
        router.replace(`/home/applicants?${params.toString()}`);
    }, [activeListingId, queriedId, router, searchParams]);

    const {
        items,
        screeningQuestions,
        skillTagsRaw,
        loading,
        error,
        updateStatus,
    } = useListingApplicants(activeListingId);

    // Default to skill-match sort when the listing has tags; otherwise the
    // founder probably just wants chronological order.
    const [sort, setSort] = useState<SortKey>("applied_desc");
    useEffect(() => {
        setSort(skillTagsRaw.length > 0 ? "match_desc" : "applied_desc");
    }, [activeListingId, skillTagsRaw.length]);

    const sortedItems = useMemo(
        () => sortApplicants(items, sort, skillTagsRaw),
        [items, sort, skillTagsRaw],
    );

    return (
        <EmptySection
            title="Applicants"
            description="Everyone who applied to your open roles."
        >
            {listingsLoading ? (
                <SectionSkeleton />
            ) : listings.length === 0 ? (
                <NoListings />
            ) : (
                <>
                    <ListingPicker
                        listings={listings}
                        activeId={activeListingId}
                        onChange={(id) =>
                            router.replace(`/home/applicants?listingId=${id}`)
                        }
                    />
                    <section className="rounded-xl border border-border bg-card overflow-hidden">
                        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="text-[13px] font-medium">
                                    Applicants
                                </div>
                                {!loading && !error && (
                                    <span className="text-[11.5px] text-muted-foreground tabular-nums">
                                        {items.length} total
                                    </span>
                                )}
                            </div>
                            <SortPicker value={sort} onChange={setSort} />
                        </header>

                        {error ? (
                            <ErrorRow message={error.message} />
                        ) : loading ? (
                            <Skeleton />
                        ) : sortedItems.length === 0 ? (
                            <Empty />
                        ) : (
                            <ul className="divide-y divide-border">
                                {sortedItems.map((applicant) => (
                                    <li key={applicant.id}>
                                        <ApplicantCard
                                            applicant={applicant}
                                            screeningQuestions={
                                                screeningQuestions
                                            }
                                            listingSkillTags={skillTagsRaw}
                                            onUpdateStatus={updateStatus}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            )}
        </EmptySection>
    );
}

function SortPicker({
    value,
    onChange,
}: {
    value: SortKey;
    onChange: (v: SortKey) => void;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as SortKey)}
            aria-label="Sort applicants"
            className={cn(
                "h-8 rounded-md border border-border bg-background pl-2 pr-7",
                "text-[12px] appearance-none cursor-pointer",
                "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
            )}
        >
            {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                    Sort: {o.label}
                </option>
            ))}
        </select>
    );
}

/**
 * Computes a sorted copy of `items` based on `sort`. Skill-match score is
 * the overlap between listing tags (`tags`) and student skills (both
 * normalised). Stable for predictable UX — same input → same order on
 * repeat renders.
 */
function sortApplicants(
    items: ApplicantWithStudent[],
    sort: SortKey,
    tags: string[],
): ApplicantWithStudent[] {
    const arr = [...items];
    switch (sort) {
        case "applied_desc":
            arr.sort(
                (a, b) =>
                    new Date(b.appliedAt).getTime() -
                    new Date(a.appliedAt).getTime(),
            );
            break;
        case "applied_asc":
            arr.sort(
                (a, b) =>
                    new Date(a.appliedAt).getTime() -
                    new Date(b.appliedAt).getTime(),
            );
            break;
        case "name_asc":
            arr.sort((a, b) =>
                applicantName(a).localeCompare(applicantName(b), undefined, {
                    sensitivity: "base",
                }),
            );
            break;
        case "college_asc":
            arr.sort((a, b) => {
                const ac = applicantCollege(a);
                const bc = applicantCollege(b);
                // Empty colleges sink to the bottom.
                if (!ac && !bc) return 0;
                if (!ac) return 1;
                if (!bc) return -1;
                return ac.localeCompare(bc, undefined, { sensitivity: "base" });
            });
            break;
        case "match_desc": {
            const tagSet = new Set(
                tags.map((t) => t.trim().toLowerCase()),
            );
            arr.sort(
                (a, b) => matchCount(b, tagSet) - matchCount(a, tagSet),
            );
            break;
        }
    }
    return arr;
}

function applicantName(a: ApplicantWithStudent): string {
    const p = a.student.studentProfile;
    return (
        `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim() ||
        a.student.name ||
        ""
    );
}

function applicantCollege(a: ApplicantWithStudent): string {
    return a.student.studentProfile?.educations?.[0]?.institute ?? "";
}

function matchCount(
    a: ApplicantWithStudent,
    tagSet: Set<string>,
): number {
    const skills = a.student.studentProfile?.skills ?? [];
    let n = 0;
    for (const s of skills) {
        if (tagSet.has(s.skill.name.trim().toLowerCase())) n += 1;
    }
    return n;
}

function ListingPicker({
    listings,
    activeId,
    onChange,
}: {
    listings: ReturnType<typeof useMyListings>["items"];
    activeId: string | null;
    onChange: (id: string) => void;
}) {
    return (
        <div className="flex items-center gap-3">
            <label
                htmlFor="listing-picker"
                className="text-[12.5px] font-medium text-muted-foreground"
            >
                Listing
            </label>
            <select
                id="listing-picker"
                value={activeId ?? ""}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "h-9 rounded-md border border-border bg-background px-2 pr-8",
                    "text-[13px] appearance-none",
                    "outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
                )}
            >
                {listings.map((l) => (
                    <option key={l.id} value={l.id}>
                        {l.title} {l.closedAt ? "(closed)" : ""}
                    </option>
                ))}
            </select>
        </div>
    );
}

function Skeleton() {
    return (
        <ul className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
                <li
                    key={i}
                    className="flex items-start gap-4 px-5 py-4 animate-pulse"
                >
                    <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 rounded-full bg-muted" />
                        <div className="h-2.5 w-2/3 rounded-full bg-muted" />
                    </div>
                </li>
            ))}
        </ul>
    );
}

function SectionSkeleton() {
    return (
        <div className="space-y-3">
            <div className="h-9 w-64 rounded-md bg-secondary animate-pulse" />
            <div className="h-40 w-full rounded-xl bg-secondary/40 animate-pulse" />
        </div>
    );
}

function Empty() {
    return (
        <div className="px-5 py-12 text-center text-[13px] text-muted-foreground">
            No applicants yet for this listing.
        </div>
    );
}

function NoListings() {
    return (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-[14px] font-medium">No listings to show.</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
                Post your first role to start collecting applicants.
            </p>
            <Link
                href="/home/manage-listings/new"
                className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline"
            >
                <Plus className="h-3 w-3" />
                Post a listing
            </Link>
        </div>
    );
}

function ErrorRow({ message }: { message: string }) {
    return (
        <div className="mx-5 my-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
            Couldn’t load applicants — {message}
        </div>
    );
}
