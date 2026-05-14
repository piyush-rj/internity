import { CheckIcon, ChevronRightIcon } from "@/src/components/dashboard/icons";
import { cn } from "@/src/lib/utils";

const steps = [
    { label: "Basic details", done: true },
    { label: "Educational background", done: true },
    { label: "Skills & interests", done: true },
    { label: "Upload resume", done: false },
    { label: "Add a portfolio project", done: false },
];

export function ProfileCompletion() {
    const completed = steps.filter((s) => s.done).length;
    const total = steps.length;
    const percent = Math.round((completed / total) * 100);
    return (
        <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-[15px] font-semibold">
                        Complete your profile
                    </h2>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        A complete profile gets 3× more recruiter views.
                    </p>
                </div>
                <span className="text-[13px] font-medium text-muted-foreground">
                    {completed}/{total}
                </span>
            </div>

            <div className="mt-4">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full rounded-full bg-brand transition-all"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <div className="mt-1.5 text-[11px] text-muted-foreground">
                    {percent}% complete
                </div>
            </div>

            <ul className="mt-4 space-y-1">
                {steps.map((s) => (
                    <li
                        key={s.label}
                        className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-secondary transition-colors text-[13px]"
                    >
                        <span
                            className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-full",
                                s.done
                                    ? "bg-success text-white"
                                    : "border border-border bg-card",
                            )}
                        >
                            {s.done && <CheckIcon className="h-2.5 w-2.5" />}
                        </span>
                        <span
                            className={cn(
                                s.done
                                    ? "text-muted-foreground line-through"
                                    : "text-foreground",
                            )}
                        >
                            {s.label}
                        </span>
                        {!s.done && (
                            <ChevronRightIcon className="text-muted-foreground ml-auto h-3.5 w-3.5" />
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
