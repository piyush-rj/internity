"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationPanel } from "@/src/components/dashboard/NotificationPanel";
import { UserMenu } from "@/src/components/navbar/UserMenu";
import { cn } from "@/src/lib/utils";

const TITLES: Record<string, string> = {
    approvals: "Approvals",
    listings: "Listings",
    founders: "Founders",
};

export function AdminTopbar() {
    const pathname = usePathname() ?? "/admin/approvals";
    const segment = pathname.split("/")[2] ?? "approvals";
    const title = TITLES[segment] ?? "Admin";

    return (
        <header
            className={cn(
                "sticky top-0 z-30 h-13 px-5 flex items-center justify-between",
                "border-b border-border bg-background/85 backdrop-blur",
            )}
        >
            <div className="flex items-center gap-2 text-[13px]">
                <Link
                    href="/admin/approvals"
                    className="text-muted-foreground hover:text-foreground"
                >
                    Admin
                </Link>
                <span className="text-muted-foreground/60">/</span>
                <span className="font-medium">{title}</span>
            </div>
            <div className="flex items-center gap-1">
                <NotificationPanel />
                <UserMenu />
            </div>
        </header>
    );
}
