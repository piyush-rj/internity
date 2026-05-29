"use client";

import { useMemo } from "react";
import { Filter, Search, X } from "lucide-react";
import type {
    ApplicationStatus,
    ScreeningAnswer,
    ScreeningQuestion,
} from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

// Sort + status + free-text + per-question screening filters for the
// applicants page. Mirrors the student-side ListingsFiltersPanel layout
// (heading, fields, "Clear all" affordance). State is owned by the parent
// so it can re-derive the filtered list and (optionally) sync to the URL.

export type SortKey =
    | "applied_desc"
    | "applied_asc"
    | "name_asc"
    | "college_asc"
    | "match_desc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "applied_desc", label: "Most recent" },
    { value: "applied_asc", label: "Oldest" },
    { value: "match_desc", label: "Best skill match" },
    { value: "name_asc", label: "Name (A–Z)" },
    { value: "college_asc", label: "College (A–Z)" },
];

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
    { value: "APPLIED", label: "Applied" },
    { value: "SHORTLISTED", label: "Shortlisted" },
    { value: "INTERVIEW", label: "Interview" },
    { value: "HIRED", label: "Hired" },
    { value: "REJECTED", label: "Rejected" },
];

export type ScreeningFilter =
    | { kind: "YES_NO"; selected: Set<"yes" | "no"> }
    | { kind: "MULTIPLE_CHOICE"; selected: Set<string> }
    | { kind: "NUMBERS"; min: number | null }
    | { kind: "SCALE_1_5"; min: number | null };

// "all" = show applicants across every listing the caller can see.
export type ListingFilter = string | "all";

export type ApplicantsFilters = {
    q: string;
    listingId: ListingFilter;
    statuses: Set<ApplicationStatus>;
    sort: SortKey;
    // Indexed by the question position on the listing. Only meaningful
    // when a specific listing is selected (questions differ per listing).
    screening: Record<number, ScreeningFilter>;
};

export function emptyApplicantsFilters(): ApplicantsFilters {
    return {
        q: "",
        listingId: "all",
        statuses: new Set<ApplicationStatus>(),
        sort: "applied_desc",
        screening: {},
    };
}

export function countActiveApplicantFilters(f: ApplicantsFilters): number {
    let n = 0;
    if (f.q.trim()) n++;
    if (f.listingId !== "all") n++;
    if (f.statuses.size > 0) n++;
    for (const sf of Object.values(f.screening)) {
        if (
            (sf.kind === "YES_NO" || sf.kind === "MULTIPLE_CHOICE") &&
            sf.selected.size > 0
        ) {
            n++;
        }
        if (
            (sf.kind === "NUMBERS" || sf.kind === "SCALE_1_5") &&
            sf.min !== null
        ) {
            n++;
        }
    }
    return n;
}

export function ApplicantsFilterPanel({
    filters,
    onChange,
    screeningQuestions,
    listings,
    visibleCount,
    totalCount,
}: {
    filters: ApplicantsFilters;
    onChange: (next: ApplicantsFilters) => void;
    // Screening questions are only meaningful when a single listing is
    // selected; pass [] otherwise and the screening section hides itself.
    screeningQuestions: ScreeningQuestion[];
    listings: ReadonlyArray<{ id: string; title: string }>;
    // Shown next to the Listing label so the count travels with the
    // selector instead of sitting on a separate header above the list.
    visibleCount?: number;
    totalCount?: number;
}) {
    const activeCount = useMemo(
        () => countActiveApplicantFilters(filters),
        [filters],
    );

    function setQ(v: string) {
        onChange({ ...filters, q: v });
    }
    function setListing(id: ListingFilter) {
        // Switching listings invalidates screening filters (different
        // question set), so reset that block.
        onChange({ ...filters, listingId: id, screening: {} });
    }
    function toggleStatus(s: ApplicationStatus) {
        const next = new Set(filters.statuses);
        if (next.has(s)) next.delete(s);
        else next.add(s);
        onChange({ ...filters, statuses: next });
    }
    function setSort(s: SortKey) {
        onChange({ ...filters, sort: s });
    }
    function setScreening(idx: number, sf: ScreeningFilter | null) {
        const next = { ...filters.screening };
        if (sf === null) delete next[idx];
        else next[idx] = sf;
        onChange({ ...filters, screening: next });
    }
    function clearAll() {
        onChange(emptyApplicantsFilters());
    }

    return (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold">
                    <Filter className="h-3.5 w-3.5 text-brand" />
                    Filters
                </div>
                {activeCount > 0 && (
                    <button
                        type="button"
                        onClick={clearAll}
                        className="inline-flex items-center gap-1 text-[11.5px] font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                        <X className="h-3 w-3" />
                        Clear all
                    </button>
                )}
            </header>

            <div className="p-4 space-y-4">
                <Field label="Search applicants">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            value={filters.q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Name, email, college"
                            className={cn(inputCls, "pl-9")}
                        />
                    </div>
                </Field>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Listing
                        </span>
                        {typeof visibleCount === "number" &&
                            typeof totalCount === "number" && (
                                <span className="text-[11px] tabular-nums text-muted-foreground">
                                    {visibleCount} of {totalCount}
                                </span>
                            )}
                    </div>
                    <select
                        value={filters.listingId}
                        onChange={(e) =>
                            setListing(e.target.value as ListingFilter)
                        }
                        className={cn(
                            inputCls,
                            "appearance-none pr-8 cursor-pointer",
                        )}
                    >
                        <option value="all">All listings</option>
                        {listings.map((l) => (
                            <option key={l.id} value={l.id}>
                                {l.title}
                            </option>
                        ))}
                    </select>
                </div>

                <Field label="Sort">
                    <select
                        value={filters.sort}
                        onChange={(e) => setSort(e.target.value as SortKey)}
                        className={cn(
                            inputCls,
                            "appearance-none pr-8 cursor-pointer",
                        )}
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Status">
                    <div className="space-y-1.5">
                        {STATUS_OPTIONS.map((o) => (
                            <CheckRow
                                key={o.value}
                                label={o.label}
                                checked={filters.statuses.has(o.value)}
                                onChange={() => toggleStatus(o.value)}
                            />
                        ))}
                    </div>
                </Field>

                {screeningQuestions.length > 0 && (
                    <Field label="Screening answers">
                        <div className="space-y-3">
                            {screeningQuestions.map((q, i) => (
                                <ScreeningFilterRow
                                    key={i}
                                    index={i}
                                    question={q}
                                    filter={filters.screening[i]}
                                    onChange={(sf) => setScreening(i, sf)}
                                />
                            ))}
                        </div>
                    </Field>
                )}
            </div>
        </section>
    );
}

function ScreeningFilterRow({
    index,
    question,
    filter,
    onChange,
}: {
    index: number;
    question: ScreeningQuestion;
    filter: ScreeningFilter | undefined;
    onChange: (next: ScreeningFilter | null) => void;
}) {
    // SHORT answers are too free-form to filter cleanly — skip the row.
    if (question.type === "SHORT") return null;

    if (question.type === "YES_NO") {
        const sel =
            filter?.kind === "YES_NO"
                ? filter.selected
                : new Set<"yes" | "no">();
        function toggle(v: "yes" | "no") {
            const next = new Set(sel);
            if (next.has(v)) next.delete(v);
            else next.add(v);
            onChange(
                next.size === 0 ? null : { kind: "YES_NO", selected: next },
            );
        }
        return (
            <div className="space-y-1">
                <QuestionLabel index={index} q={question.q} />
                <div className="flex items-center gap-3 text-[12px]">
                    <CheckRow
                        label="Yes"
                        checked={sel.has("yes")}
                        onChange={() => toggle("yes")}
                    />
                    <CheckRow
                        label="No"
                        checked={sel.has("no")}
                        onChange={() => toggle("no")}
                    />
                </div>
            </div>
        );
    }

    if (question.type === "MULTIPLE_CHOICE") {
        const sel =
            filter?.kind === "MULTIPLE_CHOICE"
                ? filter.selected
                : new Set<string>();
        function toggle(opt: string) {
            const next = new Set(sel);
            if (next.has(opt)) next.delete(opt);
            else next.add(opt);
            onChange(
                next.size === 0
                    ? null
                    : { kind: "MULTIPLE_CHOICE", selected: next },
            );
        }
        return (
            <div className="space-y-1">
                <QuestionLabel index={index} q={question.q} />
                <div className="space-y-1">
                    {question.options.map((o) => (
                        <CheckRow
                            key={o}
                            label={o}
                            checked={sel.has(o)}
                            onChange={() => toggle(o)}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (question.type === "NUMBERS") {
        const val = filter?.kind === "NUMBERS" ? filter.min : null;
        return (
            <div className="space-y-1">
                <QuestionLabel index={index} q={question.q} />
                <input
                    type="number"
                    inputMode="numeric"
                    value={val === null ? "" : val}
                    onChange={(e) => {
                        const t = e.target.value;
                        if (t === "") onChange(null);
                        else {
                            const n = Number(t);
                            onChange(
                                Number.isFinite(n)
                                    ? { kind: "NUMBERS", min: Math.trunc(n) }
                                    : null,
                            );
                        }
                    }}
                    placeholder="Min value"
                    className={inputCls}
                />
            </div>
        );
    }

    // SCALE_1_5
    const val = filter?.kind === "SCALE_1_5" ? filter.min : null;
    return (
        <div className="space-y-1">
            <QuestionLabel index={index} q={question.q} />
            <select
                value={val ?? ""}
                onChange={(e) =>
                    onChange(
                        e.target.value === ""
                            ? null
                            : {
                                  kind: "SCALE_1_5",
                                  min: Number(e.target.value),
                              },
                    )
                }
                className={cn(inputCls, "appearance-none pr-8 cursor-pointer")}
            >
                <option value="">Any rating</option>
                {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                        At least {n}
                    </option>
                ))}
            </select>
        </div>
    );
}

function QuestionLabel({ index, q }: { index: number; q: string }) {
    return (
        <div className="text-[11.5px] text-muted-foreground line-clamp-2 leading-snug">
            <span className="tabular-nums">Q{index + 1}.</span> {q}
        </div>
    );
}

const inputCls = cn(
    "w-full h-9 rounded-lg border border-border bg-background px-3",
    "text-[12.5px] placeholder:text-muted-foreground/70",
    "outline-none focus:border-brand/40 focus:ring-3 focus:ring-brand/15",
);

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
            {children}
        </label>
    );
}

function CheckRow({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <label className="flex items-center gap-2 text-[12.5px] cursor-pointer select-none">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="h-3.5 w-3.5 accent-brand"
            />
            {label}
        </label>
    );
}

// Apply the filters to a list of applicants. Sort is applied last.
// `getListingSkills` lets the page provide per-applicant skill tags when
// the list spans multiple listings (each row has its own listing context).
export function applyApplicantsFilters<
    T extends {
        appliedAt: string;
        status: ApplicationStatus;
        student: {
            name: string | null;
            email: string | null;
            studentProfile: {
                firstName: string;
                lastName: string | null;
                educations?: Array<{ institute: string }>;
                skills: Array<{ skill: { name: string } }>;
            } | null;
        };
        screeningAnswers: ScreeningAnswer[];
    },
>(
    items: T[],
    filters: ApplicantsFilters,
    getListingSkills: (item: T) => string[],
    getListingId?: (item: T) => string,
): T[] {
    const q = filters.q.trim().toLowerCase();

    let arr = items.filter((a) => {
        if (
            filters.listingId !== "all" &&
            getListingId &&
            getListingId(a) !== filters.listingId
        )
            return false;

        if (filters.statuses.size > 0 && !filters.statuses.has(a.status))
            return false;

        if (q) {
            const p = a.student.studentProfile;
            const hay = [
                p?.firstName,
                p?.lastName,
                a.student.name,
                a.student.email,
                p?.educations?.[0]?.institute,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            if (!hay.includes(q)) return false;
        }

        for (const [idxStr, sf] of Object.entries(filters.screening)) {
            const idx = Number(idxStr);
            const ans = a.screeningAnswers[idx];
            if (!ans) return false;
            const v = ans.value;
            if (sf.kind === "YES_NO") {
                if (sf.selected.size === 0) continue;
                if (
                    typeof v !== "string" ||
                    !sf.selected.has(v as "yes" | "no")
                )
                    return false;
            } else if (sf.kind === "MULTIPLE_CHOICE") {
                if (sf.selected.size === 0) continue;
                if (typeof v !== "string" || !sf.selected.has(v)) return false;
            } else if (sf.kind === "NUMBERS" || sf.kind === "SCALE_1_5") {
                if (sf.min === null) continue;
                const n = typeof v === "number" ? v : Number(v);
                if (!Number.isFinite(n) || n < sf.min) return false;
            }
        }

        return true;
    });

    switch (filters.sort) {
        case "applied_desc":
            arr = arr.sort(
                (a, b) =>
                    new Date(b.appliedAt).getTime() -
                    new Date(a.appliedAt).getTime(),
            );
            break;
        case "applied_asc":
            arr = arr.sort(
                (a, b) =>
                    new Date(a.appliedAt).getTime() -
                    new Date(b.appliedAt).getTime(),
            );
            break;
        case "name_asc":
            arr = arr.sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
            break;
        case "college_asc":
            arr = arr.sort((a, b) => {
                const ac = collegeOf(a);
                const bc = collegeOf(b);
                if (!ac && !bc) return 0;
                if (!ac) return 1;
                if (!bc) return -1;
                return ac.localeCompare(bc);
            });
            break;
        case "match_desc":
            arr = arr.sort(
                (a, b) =>
                    matchCount(b, toTagSet(getListingSkills(b))) -
                    matchCount(a, toTagSet(getListingSkills(a))),
            );
            break;
    }
    return arr;
}

function toTagSet(tags: string[]): Set<string> {
    return new Set(tags.map((t) => t.trim().toLowerCase()));
}

function nameOf(a: {
    student: {
        name: string | null;
        studentProfile: {
            firstName: string;
            lastName: string | null;
        } | null;
    };
}): string {
    const p = a.student.studentProfile;
    return (
        `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim() ||
        a.student.name ||
        ""
    );
}

function collegeOf(a: {
    student: {
        studentProfile: {
            educations?: Array<{ institute: string }>;
        } | null;
    };
}): string {
    return a.student.studentProfile?.educations?.[0]?.institute ?? "";
}

function matchCount(
    a: {
        student: {
            studentProfile: {
                skills: Array<{ skill: { name: string } }>;
            } | null;
        };
    },
    tagSet: Set<string>,
): number {
    const skills = a.student.studentProfile?.skills ?? [];
    let n = 0;
    for (const s of skills) {
        if (tagSet.has(s.skill.name.trim().toLowerCase())) n += 1;
    }
    return n;
}
