import { MeBootstrap } from "@/src/components/dashboard/MeBootstrap";
import { RoleGate } from "@/src/components/dashboard/RoleGate";
import { SavedBootstrap } from "@/src/components/dashboard/SavedBootstrap";
import { Sidebar } from "@/src/components/dashboard/Sidebar";
import { Topbar } from "@/src/components/dashboard/Topbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full">
            <MeBootstrap />
            <SavedBootstrap />
            <RoleGate />
            <Sidebar />
            <div className="flex-1 min-w-0 flex flex-col">
                <Topbar />
                <main className="flex-1">{children}</main>
            </div>
        </div>
    );
}
