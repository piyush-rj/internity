import { Suspense } from "react";
import { AppliedBootstrap } from "@/src/components/dashboard/AppliedBootstrap";
import { BreadcrumbProvider } from "@/src/components/dashboard/BreadcrumbContext";
import { MeBootstrap } from "@/src/components/dashboard/MeBootstrap";
import { ProfileCompletionBanner } from "@/src/components/dashboard/ProfileCompletionBanner";
import { RoleGate } from "@/src/components/dashboard/RoleGate";
import { SavedBootstrap } from "@/src/components/dashboard/SavedBootstrap";
import { Sidebar } from "@/src/components/dashboard/Sidebar";
import { TakedownBanner } from "@/src/components/dashboard/TakedownBanner";
import { Topbar } from "@/src/components/dashboard/Topbar";
import { UnreadChatsBootstrap } from "@/src/components/dashboard/UnreadChatsBootstrap";
import { WebSocketProvider } from "@/src/lib/socket/WebSocketProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full bg-neutral-50">
            <MeBootstrap />
            <SavedBootstrap />
            <AppliedBootstrap />
            <RoleGate />
            <Sidebar />
            <div className="flex-1 min-w-0 flex flex-col">
                <WebSocketProvider>
                    <UnreadChatsBootstrap />
                    <BreadcrumbProvider>
                        <Suspense fallback={null}>
                            <Topbar />
                        </Suspense>
                        {/* Clip stray horizontal overflow on mobile so pages
                            can't drift sideways; restored to visible at lg so
                            desktop sticky panels keep working. */}
                        <main className="flex-1 bg-neutral-50 overflow-x-clip lg:overflow-x-visible">
                            <div className="mx-auto max-w-6xl px-6 pt-4 empty:hidden">
                                <TakedownBanner />
                            </div>
                            {children}
                        </main>
                        <ProfileCompletionBanner />
                    </BreadcrumbProvider>
                </WebSocketProvider>
            </div>
        </div>
    );
}
