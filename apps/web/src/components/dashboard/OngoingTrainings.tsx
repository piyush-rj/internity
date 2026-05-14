import { ChevronRightIcon } from "@/src/components/dashboard/icons";

type Training = {
    name: string;
    progress: number;
    nextLesson: string;
};

const items: Training[] = [
    {
        name: "Full Stack Web Development",
        progress: 62,
        nextLesson: "Module 6 · API integration",
    },
    {
        name: "UI/UX Design",
        progress: 28,
        nextLesson: "Module 3 · Wireframing in Figma",
    },
];

export function OngoingTrainings() {
    return (
        <section className="rounded-xl border border-border bg-card overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                <h2 className="text-[15px] font-semibold">Continue learning</h2>
                <a
                    href="#"
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
                >
                    Browse trainings
                    <ChevronRightIcon className="h-3 w-3" />
                </a>
            </header>
            <ul className="divide-y divide-border">
                {items.map((t) => (
                    <li key={t.name} className="px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-[13px] font-medium truncate">
                                    {t.name}
                                </div>
                                <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
                                    Next: {t.nextLesson}
                                </div>
                            </div>
                            <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                                {t.progress}%
                            </span>
                        </div>
                        <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full bg-brand transition-all"
                                style={{ width: `${t.progress}%` }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
