"use client";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
    PiCalendarBlankFill,
    PiCalendarXFill,
    PiClockFill,
    PiPhoneFill,
    PiVideoCameraFill,
} from "react-icons/pi";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { useConfirm } from "@/src/hooks/useConfirm";
import {
    interviewApi,
    type InterviewWithRelations,
    type MyInterviewsResponse,
} from "@/src/lib/api";
import { useMeStore } from "@/src/store/useMeStore";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

type TabKey = "upcoming" | "past";

export default function SchedulesPage() {
    const me = useMeStore((s) => s.me);
    const [data, setData] = useState<MyInterviewsResponse>({
        upcoming: [],
        past: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const { confirm, dialogProps } = useConfirm();

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await interviewApi.list_mine();
            setData(res);
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t load your schedule.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const isStudent = me?.role === "STUDENT";

    async function cancel(iv: InterviewWithRelations) {
        if (cancellingId) return;
        const ok = await confirm({
            title: "Cancel this interview?",
            description: `"${iv.title}" on ${formatDateTime(iv.scheduledAt)} will be cancelled and the other party will be notified.`,
            confirmLabel: "Cancel interview",
            cancelLabel: "Keep it",
            variant: "destructive",
        });
        if (!ok) return;
        setCancellingId(iv.id);
        try {
            await interviewApi.cancel(iv.id);
            toast.success("Interview cancelled");
            await load();
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t cancel.",
            );
        } finally {
            setCancellingId(null);
        }
    }

    const [tab, setTab] = useState<TabKey>("upcoming");
    const items = tab === "upcoming" ? data.upcoming : data.past;
    const emptyText =
        tab === "upcoming"
            ? "Nothing on your calendar right now."
            : "No past interviews yet.";

    return (
        <EmptySection
            title="Schedules"
            description={
                isStudent
                    ? "Every interview a company has lined up with you."
                    : "Every interview you've scheduled with applicants."
            }
        >
            {error ? (
                <ErrorBox message={error} />
            ) : loading ? (
                <SkeletonList />
            ) : (
                <>
                    <Tabs
                        tab={tab}
                        onChange={setTab}
                        upcomingCount={data.upcoming.length}
                        pastCount={data.past.length}
                    />

                    {items.length === 0 ? (
                        <section className="mt-4 rounded-lg border border-border bg-card px-6 py-16 text-center text-[13px] text-muted-foreground">
                            {emptyText}
                        </section>
                    ) : (
                        <ul className="mt-4 space-y-3">
                            {items.map((iv) => (
                                <li
                                    key={iv.id}
                                    className="rounded-lg border border-border bg-card overflow-hidden"
                                >
                                    <InterviewRow
                                        iv={iv}
                                        isStudent={isStudent}
                                        onCancel={() => cancel(iv)}
                                        cancelling={cancellingId === iv.id}
                                        isPast={tab === "past"}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
            <ConfirmDialog {...dialogProps} />
        </EmptySection>
    );
}

function Tabs({
    tab,
    onChange,
    upcomingCount,
    pastCount,
}: {
    tab: TabKey;
    onChange: (next: TabKey) => void;
    upcomingCount: number;
    pastCount: number;
}) {
    const tabs: Array<{ key: TabKey; label: string }> = [
        { key: "upcoming", label: "Upcoming" },
        { key: "past", label: "Past" },
    ];
    const activeIndex = tabs.findIndex((t) => t.key === tab);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [indicator, setIndicator] = useState<{
        left: number;
        width: number;
    } | null>(null);

    useLayoutEffect(() => {
        const el = tabRefs.current[activeIndex];
        if (!el) return;
        setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }, [activeIndex]);

    const activeCount = tab === "upcoming" ? upcomingCount : pastCount;

    return (
        <div className="flex items-center justify-between gap-3">
            <nav
                role="tablist"
                aria-label="Schedules tabs"
                className="relative inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-xs"
            >
                {indicator && (
                    <span
                        aria-hidden
                        className="absolute top-1 bottom-1 rounded-md bg-brand ring-1 ring-border transition-[left,width] duration-300 ease-out"
                        style={{
                            left: indicator.left,
                            width: indicator.width,
                        }}
                    />
                )}
                {tabs.map((t, i) => {
                    const active = t.key === tab;
                    return (
                        <button
                            key={t.key}
                            ref={(el) => {
                                tabRefs.current[i] = el;
                            }}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onChange(t.key)}
                            className={cn(
                                "relative z-10 inline-flex items-center h-8 px-3.5 rounded-md text-[12.5px] font-medium cursor-pointer",
                                "transition-colors duration-200 ease-out",
                                active
                                    ? "text-white"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </nav>

            <span className="text-[12px] text-muted-foreground tabular-nums">
                {activeCount} {activeCount === 1 ? "interview" : "interviews"}
            </span>
        </div>
    );
}

function InterviewRow({
    iv,
    isStudent,
    onCancel,
    cancelling,
    isPast,
}: {
    iv: InterviewWithRelations;
    isStudent: boolean;
    onCancel: () => void;
    cancelling: boolean;
    isPast?: boolean;
}) {
    const counterpart = isStudent ? iv.host : iv.candidate;
    const counterpartName = counterpart.name ?? counterpart.email ?? "—";
    const company = iv.application.listing.company;
    const phone = isStudent ? iv.hostPhone : iv.candidatePhone;
    const isCancelled = iv.status === "CANCELLED";
    const [now] = useState(() => Date.now());
    const isJoinable = useMemo(() => {
        if (iv.type !== "VIDEO" || !iv.meetingLink || isCancelled) return false;
        const startsAt = new Date(iv.scheduledAt).getTime();
        const endsAt = new Date(iv.endsAt).getTime();
        return now >= startsAt - 10 * 60_000 && now <= endsAt;
    }, [iv, isCancelled, now]);

    return (
        <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start gap-3 sm:gap-4">
                <Logo
                    name={company.name}
                    logoUrl={company.logoUrl}
                    type={iv.type}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[16px] font-medium tracking-tight truncate">
                            {iv.title}
                        </h3>
                        <TypeChip type={iv.type} />
                        {isCancelled && <CancelledChip />}
                    </div>
                    <div className="mt-0.5 text-[13px] text-foreground/70 truncate">
                        with{" "}
                        {isStudent ? (
                            <span className="font-medium text-foreground/90">
                                {counterpartName}
                            </span>
                        ) : (
                            <Link
                                href={`/student/${counterpart.id}`}
                                className="font-medium text-foreground/90 hover:text-orange-600 hover:underline"
                            >
                                {counterpartName}
                            </Link>
                        )}{" "}
                        ·{" "}
                        {isStudent ? (
                            <Link
                                href={`/company/${company.slug}`}
                                className="font-medium text-foreground/90 hover:text-orange-600 hover:underline"
                            >
                                {company.name}
                            </Link>
                        ) : (
                            <span>{company.name}</span>
                        )}{" "}
                        ·{" "}
                        <span className="text-muted-foreground">
                            {iv.application.listing.title}
                        </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-foreground/70">
                        <Meta
                            icon={
                                <PiCalendarBlankFill className="h-3.5 w-3.5 text-orange-600/80" />
                            }
                            text={formatDateTime(iv.scheduledAt)}
                        />
                        <Meta
                            icon={
                                <PiClockFill className="h-3.5 w-3.5 text-orange-600/80" />
                            }
                            text={`${formatTime(iv.scheduledAt)} – ${formatTime(iv.endsAt)}`}
                        />
                        {phone && (
                            <Meta
                                icon={
                                    <PiPhoneFill className="h-3.5 w-3.5 text-orange-600/80" />
                                }
                                text={phone}
                            />
                        )}
                    </div>

                    {iv.type === "VIDEO" && iv.meetingLink && (
                        <a
                            href={iv.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-orange-600 hover:text-orange-800 hover:underline max-w-full truncate"
                            title={iv.meetingLink}
                        >
                            <PiVideoCameraFill className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{iv.meetingLink}</span>
                        </a>
                    )}

                    {iv.description && (
                        <p className="mt-3 text-[13.5px] text-foreground/80 whitespace-pre-wrap leading-relaxed line-clamp-3">
                            {iv.description}
                        </p>
                    )}

                    {iv.cancelReason && isCancelled && (
                        <p className="mt-3 text-[13px] text-rose-700">
                            Cancelled · {iv.cancelReason}
                        </p>
                    )}
                </div>
            </div>

            {!isPast && !isCancelled && (
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={cancelling}
                        className="h-9 px-3 text-[13px] text-rose-600 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                        <PiCalendarXFill className="h-3.5 w-3.5" />
                        {cancelling ? "Cancelling…" : "Cancel"}
                    </Button>
                    {iv.type === "VIDEO" && iv.meetingLink && (
                        <a
                            href={iv.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                                "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[13px] font-medium",
                                isJoinable
                                    ? "bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-500/20"
                                    : "border border-border bg-white text-foreground hover:bg-secondary",
                            )}
                        >
                            <PiVideoCameraFill className="h-3.5 w-3.5" />
                            {isJoinable ? "Join now" : "Open link"}
                        </a>
                    )}
                    {iv.type === "PHONE" && phone && !isStudent && (
                        <a
                            href={`tel:${phone}`}
                            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[13px] font-medium border border-border bg-white text-foreground hover:bg-secondary"
                        >
                            <PiPhoneFill className="h-3.5 w-3.5" />
                            Call
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}

function Logo({
    name,
    logoUrl,
    type,
}: {
    name: string;
    logoUrl: string | null;
    type: "VIDEO" | "PHONE";
}) {
    if (logoUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={logoUrl}
                alt={`${name} logo`}
                className="h-12 w-12 rounded-lg object-cover ring-1 ring-border shrink-0 bg-white"
            />
        );
    }
    return (
        <span
            className={cn(
                "h-12 w-12 rounded-lg flex items-center justify-center shrink-0",
                "bg-secondary text-foreground text-[16px] font-semibold ring-1 ring-border",
            )}
        >
            {type === "VIDEO" ? (
                <PiVideoCameraFill className="h-5 w-5 text-muted-foreground" />
            ) : (
                name.charAt(0).toUpperCase()
            )}
        </span>
    );
}

function TypeChip({ type }: { type: "VIDEO" | "PHONE" }) {
    if (type === "VIDEO") {
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 text-[11px] font-medium">
                <PiVideoCameraFill className="h-3 w-3" />
                Video
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-[11px] font-medium">
            <PiPhoneFill className="h-3 w-3" />
            Phone
        </span>
    );
}

function CancelledChip() {
    return (
        <span className="inline-flex items-center rounded-md bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[11px] font-medium">
            Cancelled
        </span>
    );
}

function Meta({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            {icon}
            <span className="truncate font-medium tabular-nums">{text}</span>
        </span>
    );
}

function SkeletonList() {
    return (
        <>
            <div className="h-10 w-44 rounded-lg border border-border bg-card animate-pulse" />
            <div className="rounded-lg border border-border bg-card overflow-hidden mt-4">
                <ul className="divide-y divide-border">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <li
                            key={i}
                            className="px-6 py-5 flex items-start gap-4 animate-pulse"
                        >
                            <div className="h-12 w-12 rounded-lg bg-secondary shrink-0" />
                            <div className="flex-1 space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-40 rounded bg-secondary" />
                                    <div className="h-4 w-14 rounded-md bg-secondary" />
                                </div>
                                <div className="h-3 w-2/3 rounded bg-secondary" />
                                <div className="flex items-center gap-3 pt-1">
                                    <div className="h-3 w-32 rounded bg-secondary" />
                                    <div className="h-3 w-24 rounded bg-secondary" />
                                </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                                <div className="h-9 w-24 rounded-md bg-secondary" />
                                <div className="h-9 w-20 rounded-md bg-secondary" />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}

function ErrorBox({ message }: { message: string }) {
    return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
            {message}
        </div>
    );
}

/* ------------------------------- helpers --------------------------------- */

// en-US for upper-case AM/PM which reads cleaner than en-IN's "am"/"pm" at
// the larger schedule typography.
function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}
