import { AdminGuard } from "@/src/components/admin/AdminGuard";
import { AdminSidebar } from "@/src/components/admin/AdminSidebar";
import { AdminTopbar } from "@/src/components/admin/AdminTopbar";
import { MeBootstrap } from "@/src/components/dashboard/MeBootstrap";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full">
            <MeBootstrap />
            <AdminSidebar />
            <div className="flex-1 min-w-0 flex flex-col">
                <AdminTopbar />
                <main className="flex-1">
                    <AdminGuard>{children}</AdminGuard>
                </main>
            </div>
        </div>
    );
}
