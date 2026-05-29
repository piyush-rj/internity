import { cn } from "@/src/lib/utils";
import Image from "next/image";

type FooterLink = { label: string; href: string };

export function Footer() {
    const cols: Record<string, FooterLink[]> = {
        "For students": [
            { label: "Internships", href: "/home/internships" },
            { label: "Interview questions", href: "/interview-questions" },
            { label: "Student FAQ's", href: "/faq" },
        ],
        "For employers": [
            // Posting requires an account — middleware sends signed-out
            // visitors through the sign-in flow.
            { label: "Post an internship", href: "/home/manage-listings/new" },
            { label: "Hire interns for your company", href: "/for-employers" },
            { label: "Employer FAQ's", href: "/faq/employers" },
        ],
        Company: [
            { label: "About us", href: "/about" },
            { label: "Contact", href: "/contact" },
            { label: "Collaborate with us", href: "/collaborate" },
        ],
        Help: [
            { label: "Privacy and policy", href: "/privacy" },
            { label: "Terms and conditions", href: "/terms" },
            { label: "Report a problem", href: "/contact" },
        ],
    };
    return (
        <footer className="border-t border-black/6 pt-10 sm:pt-14 pb-6">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6 sm:gap-8">
                    <div className="col-span-2 sm:col-span-4 md:col-span-2">
                        <div className="flex items-center gap-2">
                            <div className="relative h-7.5 w-7.5 shrink-0 ring-1 ring-black/15 rounded-sm bg-linear-to-b from-neutral-50 to-neutral-100 shadow-sm shadow-black/10 overflow-hidden flex justify-center items-center inset-shadow-xs inset-shadow-black/10">
                                <Image
                                    src={"/app-logos/logo.png"}
                                    alt="app-logo"
                                    className="object-cover pt-0.75 scale-120"
                                    fill
                                    unoptimized
                                />
                            </div>
                            <span className="text-[16px] font-semibold tracking-tight">
                                SpiderSkill
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
                                    <li key={l.label}>
                                        <a
                                            href={l.href}
                                            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {l.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div
                    className={cn(
                        "mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 -mx-4 sm:-mx-6 px-4 sm:px-6",
                        "border-t border-black/6 pt-6",
                        "text-[12px] text-muted-foreground",
                    )}
                >
                    <div>© {new Date().getFullYear()} SpiderSkill</div>
                    <div className="flex items-center gap-4">
                        <a href="/privacy" className="hover:text-foreground">
                            Privacy
                        </a>
                        <a href="/terms" className="hover:text-foreground">
                            Terms
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
