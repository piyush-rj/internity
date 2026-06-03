import { SectionShell } from "@/src/components/base/SectionShell";
import { cn } from "@/src/lib/utils";

export function InternshipsSection() {
    return (
        <SectionShell
            title="Find an internship that opens doors"
            subtitle="Browse 70,000+ openings across 50+ profiles. Filter by location, stipend, and work-from-home options."
            cta={{ label: "Browse opportunities", href: "/home/internships" }}
        >
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <CategoryCard
                    status="Trending"
                    color="bg-success"
                    items={[
                        {
                            id: "WEB",
                            title: "Web Development",
                            count: "14,200 internships",
                        },
                        {
                            id: "MKT",
                            title: "Digital Marketing",
                            count: "8,400 internships",
                        },
                        {
                            id: "HR",
                            title: "Human Resources",
                            count: "5,100 internships",
                        },
                    ]}
                />
                <CategoryCard
                    status="Work from home"
                    color="bg-brand"
                    items={[
                        {
                            id: "CW",
                            title: "Content Writing",
                            count: "9,800 internships",
                        },
                        {
                            id: "GD",
                            title: "Graphic Design",
                            count: "6,300 internships",
                        },
                        {
                            id: "SM",
                            title: "Social Media Marketing",
                            count: "5,700 internships",
                        },
                    ]}
                />
                <CategoryCard
                    status="High stipend"
                    color="bg-yellow-500"
                    items={[
                        {
                            id: "DS",
                            title: "Data Science",
                            count: "₹30k+ stipend",
                        },
                        {
                            id: "PM",
                            title: "Product Management",
                            count: "₹40k+ stipend",
                        },
                        {
                            id: "ML",
                            title: "Machine Learning",
                            count: "₹35k+ stipend",
                        },
                    ]}
                />
            </div>
        </SectionShell>
    );
}

function CategoryCard({
    status,
    color,
    items,
}: {
    status: string;
    color: string;
    items: { id: string; title: string; count: string }[];
}) {
    return (
        <div className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <span className={cn("h-2 w-2 rounded-full", color)} />
                <span className="text-[13px] font-medium">{status}</span>
            </div>
            <div className="space-y-2">
                {items.map((it) => (
                    <a
                        key={it.id}
                        href="/home/internships"
                        className={cn(
                            "block p-3",
                            "rounded-lg border border-black/5 bg-surface/40",
                            "hover:bg-surface transition-colors",
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground">
                                {it.id}
                            </span>
                        </div>
                        <div className="mt-1 text-[13px] text-foreground font-medium leading-snug">
                            {it.title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {it.count}
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
