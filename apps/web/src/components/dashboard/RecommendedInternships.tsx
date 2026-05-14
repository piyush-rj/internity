import {
    BookmarkIcon,
    ChevronRightIcon,
    ClockIcon,
    MapPinIcon,
} from "@/src/components/dashboard/icons";
import { cn } from "@/src/lib/utils";

type Item = {
    company: string;
    role: string;
    location: string;
    mode: string;
    stipend: string;
    duration: string;
    tag?: string;
    posted: string;
    initial: string;
    initialBg: string;
};

const items: Item[] = [
    {
        company: "Razorpay",
        role: "Frontend Developer Intern",
        location: "Bengaluru",
        mode: "Hybrid",
        stipend: "₹30,000/mo",
        duration: "6 months",
        tag: "Job offer",
        posted: "Posted today",
        initial: "R",
        initialBg: "bg-indigo-500",
    },
    {
        company: "Zomato",
        role: "Product Management Intern",
        location: "Bengaluru",
        mode: "Work from office",
        stipend: "₹25,000/mo",
        duration: "3 months",
        tag: "Actively hiring",
        posted: "2 days ago",
        initial: "Z",
        initialBg: "bg-red-500",
    },
    {
        company: "Swiggy",
        role: "UI/UX Design Intern",
        location: "Remote",
        mode: "Work from home",
        stipend: "₹18,000/mo",
        duration: "4 months",
        tag: "Internity verified",
        posted: "3 days ago",
        initial: "S",
        initialBg: "bg-orange-500",
    },
    {
        company: "CRED",
        role: "Growth Marketing Intern",
        location: "Bengaluru",
        mode: "Hybrid",
        stipend: "₹22,000/mo",
        duration: "6 months",
        posted: "4 days ago",
        initial: "C",
        initialBg: "bg-zinc-900",
    },
];

export function RecommendedInternships() {
    return (
        <section className="rounded-xl border border-border bg-card overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                <div>
                    <h2 className="text-[15px] font-semibold">
                        Recommended for you
                    </h2>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                        Based on your skills and saved internships.
                    </p>
                </div>
                <a
                    href="#"
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
                >
                    See all
                    <ChevronRightIcon className="h-3 w-3" />
                </a>
            </header>
            <ul className="divide-y divide-border">
                {items.map((it) => (
                    <li
                        key={it.role}
                        className="flex items-start gap-4 px-5 py-4 hover:bg-secondary/40 transition-colors"
                    >
                        <span
                            className={cn(
                                "h-10 w-10 rounded-md text-white text-[14px] font-semibold flex items-center justify-center shrink-0",
                                it.initialBg,
                            )}
                        >
                            {it.initial}
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[14px] font-medium">
                                    {it.role}
                                </span>
                                {it.tag && (
                                    <span className="rounded-md bg-brand-soft text-brand px-1.5 py-0.5 text-[10px] font-medium">
                                        {it.tag}
                                    </span>
                                )}
                            </div>
                            <div className="mt-0.5 text-[12px] text-muted-foreground">
                                {it.company}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                    <MapPinIcon className="h-3 w-3" />
                                    {it.location} · {it.mode}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <ClockIcon className="h-3 w-3" />
                                    {it.duration}
                                </span>
                                <span className="text-foreground font-medium">
                                    {it.stipend}
                                </span>
                                <span>· {it.posted}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                aria-label="Save"
                                className={cn(
                                    "h-8 w-8 inline-flex items-center justify-center",
                                    "rounded-md",
                                    "text-muted-foreground hover:bg-secondary hover:text-foreground",
                                    "transition-colors",
                                )}
                            >
                                <BookmarkIcon className="h-4 w-4" />
                            </button>
                            <a
                                href="#"
                                className={cn(
                                    "inline-flex items-center h-8 px-3",
                                    "rounded-md border border-border bg-card hover:bg-secondary",
                                    "text-[12px] font-medium",
                                    "transition-colors",
                                )}
                            >
                                Apply
                            </a>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
