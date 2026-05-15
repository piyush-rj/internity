"use client";
import Link from "next/link";
import { CheckIcon, ChevronRightIcon } from "@/src/components/dashboard/icons";
import {
    computeCompletion,
    stepsConfig,
    type StepKey,
} from "@/src/components/profile-wizard/utils";
import { useMyProfile } from "@/src/hooks/useMyProfile";
import { cn } from "@/src/lib/utils";

// Sections that count toward completion (everything except the read-only
// "summary" tab, which isn't something the user actively fills in).
const editableSteps = stepsConfig.filter((s) => s.key !== "summary");

export function ProfileCompletion() {
    const { profile, loading } = useMyProfile();
    const { done, pct } = computeCompletion(profile);
    const completed = editableSteps.filter((s) => done[s.key]).length;
    const total = editableSteps.length;

    return (
        <section className="rounded-md border border-border bg-card/90 backdrop-blur-sm shadow-xs p-5 transition-shadow duration-200 hover:shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-[15px] font-semibold">
                        Complete your profile
                    </h2>
                    {/* <p className="mt-1 text-[11px] text-muted-foreground">
                        A complete profile gets 3× more recruiter views.
                    </p> */}
                </div>
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11.5px] font-semibold text-orange-600 ring-1 ring-orange-100 tabular-nums">
                    {loading ? "—/—" : `${completed}/${total}`}
                </span>
            </div>

            <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full rounded-full bg-orange-600 transition-all"
                        style={{ width: `${loading ? 0 : pct}%` }}
                    />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] tabular-nums">
                    <span className="text-muted-foreground">
                        {loading ? "—" : `${pct}% complete`}
                    </span>
                    {!loading && pct < 100 && (
                        <span className="text-orange-600 font-medium">
                            {total - completed} left
                        </span>
                    )}
                </div>
            </div>

            <ul className="mt-4 space-y-1">
                {editableSteps.map((step) => (
                    <StepRow
                        key={step.key}
                        stepKey={step.key}
                        label={step.label}
                        done={!loading && done[step.key]}
                    />
                ))}
            </ul>
        </section>
    );
}

function StepRow({
    stepKey,
    label,
    done,
}: {
    stepKey: StepKey;
    label: string;
    done: boolean;
}) {
    // Basics edits live inside the summary card; everything else has its own
    // scroll target on /home/profile.
    const anchor =
        stepKey === "basics" ? "profile-summary" : `profile-${stepKey}`;
    return (
        <li>
            <Link
                href={`/home/profile#${anchor}`}
                className={cn(
                    "group flex items-center gap-3 rounded-md px-2 py-1.5",
                    "hover:bg-secondary transition-colors text-[13px]",
                )}
            >
                <span
                    className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full shrink-0",
                        done
                            ? "bg-success text-white"
                            : "border border-border bg-card",
                    )}
                >
                    {done && <CheckIcon className="h-2.5 w-2.5" />}
                </span>
                <span
                    className={cn(
                        "min-w-0 truncate",
                        done ? "" : "text-foreground",
                    )}
                >
                    {label}
                </span>
                {!done && (
                    <ChevronRightIcon className="text-muted-foreground ml-auto h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
                )}
            </Link>
        </li>
    );
}
