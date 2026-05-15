import { cn } from "@/src/lib/utils";

export function Footer() {
    const cols: Record<string, string[]> = {
        "For students": [
            "Internships",
            "Jobs for freshers",
            "Online trainings",
            "Placement Guarantee",
            "Resume builder",
            "Career advice blog",
        ],
        "For employers": [
            "Post an internship",
            "Post a job",
            "Search candidates",
            "Pricing",
            "Branding solutions",
            "Hiring guide",
        ],
        Company: ["About us", "Team", "Careers", "Press", "Contact"],
        Help: ["FAQs", "Trust & safety", "Report a problem", "Sitemap"],
    };
    return (
        <footer className="border-t border-black/6 pt-14 pb-6">
            <div className="mx-auto max-w-6xl px-6">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
                    <div className="col-span-2 md:col-span-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[16px] font-semibold tracking-tight">
                                internity
                            </span>
                        </div>
                        <p className="mt-3 text-[13px] text-muted-foreground max-w-xs">
                            India&apos;s largest career platform for students
                            and freshers to grab their firsts with skills.
                        </p>
                    </div>
                    {Object.entries(cols).map(([heading, links]) => (
                        <div key={heading}>
                            <div className="text-[12px] font-medium text-foreground mb-3">
                                {heading}
                            </div>
                            <ul className="space-y-2">
                                {links.map((l) => (
                                    <li key={l}>
                                        <a
                                            href="#"
                                            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {l}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div
                    className={cn(
                        "mt-12 flex flex-col sm:flex-row items-center justify-between -mx-6 px-6",
                        "border-t border-black/6 pt-6",
                        "text-[12px] text-muted-foreground",
                    )}
                >
                    <div>
                        © {new Date().getFullYear()} Internity Technologies Pvt.
                        Ltd.
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-foreground">
                            Privacy
                        </a>
                        <a href="#" className="hover:text-foreground">
                            Terms
                        </a>
                        <a href="#" className="hover:text-foreground">
                            Cookies
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
