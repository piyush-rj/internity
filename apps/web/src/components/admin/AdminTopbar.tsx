"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { NotificationPanel } from "@/src/components/dashboard/NotificationPanel";
import { MobileNavDrawer } from "@/src/components/dashboard/MobileNavDrawer";
import { AdminSidebarBody } from "@/src/components/admin/AdminSidebar";
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
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <header
            className={cn(
                "sticky top-0 z-30 h-13 px-4 sm:px-5 flex items-center justify-between gap-3",
                "border-b border-border bg-card",
            )}
        >
            <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className={cn(
                    "lg:hidden h-9 w-9 -ml-1 inline-flex items-center justify-center shrink-0",
                    "rounded-md text-muted-foreground",
                    "hover:bg-secondary hover:text-foreground transition-colors",
                )}
            >
                <Menu className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0 flex items-center gap-2 text-[13px]">
                <Link
                    href="/admin/approvals"
                    className="text-muted-foreground hover:text-foreground"
                >
                    Admin
                </Link>
                <span className="text-muted-foreground/60">/</span>
                <span className="font-medium truncate">{title}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <NotificationPanel />
                <UserMenu />
            </div>
            <MobileNavDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                ariaLabel="Admin navigation"
            >
                <AdminSidebarBody
                    onNavigate={() => setDrawerOpen(false)}
                />
            </MobileNavDrawer>
        </header>
    );
}
