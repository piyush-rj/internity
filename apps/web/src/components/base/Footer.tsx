import {
    Briefcase,
    Building2,
    GraduationCap,
    Headphones,
    ShieldCheck,
    type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { SocialLinks } from "@/src/components/base/SocialLinks";
import { FooterSkyline } from "@/src/components/base/FooterSkyline";

type FooterLink = { label: string; href: string };
type FooterColumn = { heading: string; Icon: LucideIcon; links: FooterLink[] };

const COLUMNS: FooterColumn[] = [
    {
        heading: "For students",
        Icon: GraduationCap,
        links: [
            { label: "Internships", href: "/home/internships" },
            { label: "Interview questions", href: "/interview-questions" },
            { label: "Student FAQ's", href: "/faq" },
        ],
    },
    {
        heading: "For employers",
        Icon: Briefcase,
        links: [
            // Posting requires an account — middleware sends signed-out
            // visitors through the sign-in flow.
            { label: "Post an internship", href: "/home/manage-listings/new" },
            { label: "Hire interns for your company", href: "/for-employers" },
            { label: "Employer FAQ's", href: "/faq/employers" },
        ],
    },
    {
        heading: "Company",
        Icon: Building2,
        links: [
            { label: "About us", href: "/about" },
            { label: "Contact", href: "/contact" },
            { label: "Collaborate with us", href: "/collaborate" },
        ],
    },
    {
        heading: "Help",
        Icon: Headphones,
        links: [
            { label: "Privacy and policy", href: "/privacy" },
            { label: "Terms and conditions", href: "/terms" },
            { label: "Report a problem", href: "/contact" },
        ],
    },
];

export function Footer() {
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
                        <SocialLinks className="mt-4" />
                    </div>
                    {COLUMNS.map(({ heading, Icon, links }) => (
                        <div key={heading}>
                            <div className="flex items-center gap-2 mb-3">
                                <Icon className="h-4 w-4 text-orange-500" />
                                <span className="text-[13px] font-semibold text-foreground">
                                    {heading}
                                </span>
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
                <div className="mt-10 sm:mt-12 -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-black/6 pt-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                            <ShieldCheck className="h-4 w-4 text-orange-500 shrink-0" />
                            <span>
                                © {new Date().getFullYear()} SpiderSkill. All
                                rights reserved.
                            </span>
                        </div>
                        <FooterSkyline className="hidden sm:block h-14 w-auto shrink-0" />
                    </div>
                </div>
            </div>
        </footer>
    );
}
