import { ChevronRightIcon } from "@/src/components/dashboard/icons";
import { cn } from "@/src/lib/utils";

type App = {
    company: string;
    role: string;
    appliedOn: string;
    status: "Applied" | "Shortlisted" | "Interview" | "Rejected";
    initial: string;
    initialBg: string;
};

const items: App[] = [
    {
        company: "Razorpay",
        role: "Frontend Developer Intern",
        appliedOn: "12 May",
        status: "Interview",
        initial: "R",
        initialBg: "bg-indigo-500",
    },
    {
        company: "Meesho",
        role: "Data Analyst Intern",
        appliedOn: "10 May",
        status: "Shortlisted",
        initial: "M",
        initialBg: "bg-pink-500",
    },
    {
        company: "Swiggy",
        role: "UI/UX Design Intern",
        appliedOn: "9 May",
        status: "Applied",
        initial: "S",
        initialBg: "bg-orange-500",
    },
    {
        company: "Zomato",
        role: "Marketing Intern",
        appliedOn: "5 May",
        status: "Rejected",
        initial: "Z",
        initialBg: "bg-red-500",
    },
];

const statusStyles: Record<App["status"], string> = {
    Applied: "bg-muted text-muted-foreground",
    Shortlisted: "bg-brand-soft text-brand",
    Interview: "bg-success/10 text-success",
    Rejected: "bg-destructive/10 text-destructive",
};

export function Applications() {
    return (
        <section className="rounded-xl border border-border bg-card overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                <h2 className="text-[15px] font-semibold">Your applications</h2>
                <a
                    href="#"
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
                >
                    View all
                    <ChevronRightIcon className="h-3 w-3" />
                </a>
            </header>
            <ul className="divide-y divide-border">
                {items.map((a) => (
                    <li
                        key={a.company + a.role}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors"
                    >
                        <span
                            className={cn(
                                "h-8 w-8 rounded-md text-white text-[12px] font-semibold flex items-center justify-center shrink-0",
                                a.initialBg,
                            )}
                        >
                            {a.initial}
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium truncate">
                                {a.role}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                                {a.company} · Applied {a.appliedOn}
                            </div>
                        </div>
                        <span
                            className={cn(
                                "rounded-md px-2 py-0.5 text-[10px] font-medium",
                                statusStyles[a.status],
                            )}
                        >
                            {a.status}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
