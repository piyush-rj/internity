import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/src/lib/utils";

export function WindowMock() {
    return (
        <div
            className={cn(
                "overflow-hidden",
                "rounded-t-2xl border border-b-0 border-border",
                "bg-background",
                "shadow-[0_30px_80px_-30px_rgba(15,23,42,0.18)]",
            )}
        >
            <div
                className={cn(
                    "flex items-center gap-2",
                    "border-b border-border bg-card",
                    "px-3 py-2 sm:px-4 sm:py-2.5",
                )}
            >
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#28c840]" />
                <div className="ml-2 sm:ml-4 text-[10px] sm:text-[11px] text-muted-foreground truncate">
                    <span className="sm:hidden">SpiderSkill.app</span>
                    <span className="hidden sm:inline">
                        spiderskill.com · Internships · Web Development
                    </span>
                </div>
                <div className="ml-auto hidden sm:flex items-center gap-1.5">
                    <kbd
                        className={cn(
                            "rounded border border-border bg-secondary",
                            "px-1.5 py-0.5",
                            "text-[10px] font-mono text-muted-foreground",
                        )}
                    >
                        ⌘K
                    </kbd>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
                <aside
                    className={cn(
                        "hidden sm:block",
                        "border-r border-border bg-secondary/40",
                        "p-3 sm:min-h-110",
                        "text-[12px]",
                    )}
                >
                    <SidebarLabel>Filters</SidebarLabel>
                    <SidebarItem label="Work from home" badge="14k" active />
                    <SidebarItem label="Part-time" badge="6.2k" />
                    <SidebarItem label="With job offer" badge="2.1k" />
                    <SidebarLabel>Profile</SidebarLabel>
                    <SidebarItem label="Engineering" badge="9.4k" />
                    <SidebarItem label="Marketing" badge="5.1k" />
                    <SidebarItem label="Design" badge="3.8k" />
                    <SidebarItem label="Finance" badge="2.6k" />
                    <SidebarItem label="Operations" badge="2.0k" />
                    <SidebarLabel>Stipend</SidebarLabel>
                    <SidebarItem label="₹10,000+" />
                    <SidebarItem label="₹20,000+" />
                </aside>

                <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[12px] sm:text-[13px] font-medium truncate">
                                Top matches for you
                            </span>
                            <span className="text-[11px] text-muted-foreground shrink-0">
                                128
                            </span>
                        </div>
                        <div className="hidden sm:flex gap-1.5">
                            <PillBtn>Sort</PillBtn>
                            <PillBtn>Saved</PillBtn>
                        </div>
                    </div>
                    <InternshipRow
                        role="Frontend Developer Intern"
                        company="Razorpay"
                        location="Bengaluru"
                        mode="Hybrid"
                        stipend="₹30,000/month"
                        duration="6 months"
                        tag="Job offer"
                        tagColor="bg-brand/10 text-brand"
                        logo="/brand-logos/razorpay-logo.png"
                    />
                    <InternshipRow
                        role="Product Management Intern"
                        company="Zomato"
                        location="Bengaluru"
                        mode="Work from office"
                        stipend="₹25,000/month"
                        duration="3 months"
                        tag="Actively hiring"
                        tagColor="bg-success/10 text-success"
                        logo="/brand-logos/zomato.png"
                    />
                    <InternshipRow
                        role="UI/UX Design Intern"
                        company="Swiggy"
                        location="Remote"
                        mode="Work from home"
                        stipend="₹18,000/month"
                        duration="4 months"
                        tag="SpiderSkill verified"
                        tagColor="bg-violet-500/10 text-violet-600"
                        logo="/brand-logos/swiggy.jpeg"
                    />
                    <InternshipRow
                        role="Growth Marketing Intern"
                        company="CRED"
                        location="Bengaluru"
                        mode="Hybrid"
                        stipend="₹22,000/month"
                        duration="6 months"
                        tag="Fast response"
                        tagColor="bg-yellow-500/10 text-yellow-700"
                        logo="/brand-logos/cred.jpeg"
                    />
                    <InternshipRow
                        role="Growth Marketing Intern"
                        company="LinkedIn"
                        location="Pune"
                        mode="Remote"
                        stipend="₹22,000/month"
                        duration="6 months"
                        tag="Fast response"
                        tagColor="bg-yellow-500/10 text-yellow-700"
                        logo="/brand-logos/linkedin.png"
                    />
                </div>
            </div>
        </div>
    );
}

function SidebarLabel({ children }: { children: ReactNode }) {
    return (
        <div
            className={cn(
                "px-1.5 pt-3 pb-1",
                "text-[10px] uppercase tracking-wider text-muted-foreground",
            )}
        >
            {children}
        </div>
    );
}

function SidebarItem({
    label,
    badge,
    active,
}: {
    label: string;
    badge?: string;
    active?: boolean;
}) {
    return (
        <div
            className={cn(
                "flex items-center justify-between px-1.5 py-1.5 rounded-md text-[12px]",
                active
                    ? "bg-brand/10 text-brand font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
        >
            <span className="flex items-center gap-2">
                <span
                    className={cn(
                        "h-3 w-3 rounded border",
                        active ? "bg-brand border-brand" : "border-border",
                    )}
                />
                <span>{label}</span>
            </span>
            {badge && (
                <span className="text-[10px] text-muted-foreground bg-muted rounded px-1">
                    {badge}
                </span>
            )}
        </div>
    );
}

function PillBtn({ children }: { children: ReactNode }) {
    return (
        <button
            className={cn(
                "rounded-md border border-border bg-card",
                "px-2 py-0.5",
                "text-[11px] text-muted-foreground hover:text-foreground",
            )}
        >
            {children}
        </button>
    );
}

function InternshipRow({
    role,
    company,
    location,
    mode,
    stipend,
    duration,
    tag,
    tagColor,
    logo,
}: {
    role: string;
    company: string;
    location: string;
    mode: string;
    stipend: string;
    duration: string;
    tag: string;
    tagColor: string;
    logo: string;
}) {
    return (
        <div className="flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 px-1.5 sm:px-2 border-b border-border last:border-0 hover:bg-secondary/40 text-[11px] sm:text-[12px]">
            <span className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-md overflow-hidden bg-white ring-1 ring-border shrink-0">
                <Image
                    src={logo}
                    alt={`${company} logo`}
                    fill
                    sizes="36px"
                    className="object-cover"
                />
            </span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="font-medium text-foreground truncate">
                        {role}
                    </span>
                    <span
                        className={cn(
                            "rounded px-1.5 py-0.5 text-[9.5px] sm:text-[10px] shrink-0",
                            tagColor,
                        )}
                    >
                        {tag}
                    </span>
                </div>
                <div className="mt-0.5 text-muted-foreground truncate">
                    {company} · {location} · {mode}
                </div>
            </div>
            <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-foreground font-medium">{stipend}</span>
                <span className="text-muted-foreground text-[11px]">
                    {duration}
                </span>
            </div>
        </div>
    );
}
