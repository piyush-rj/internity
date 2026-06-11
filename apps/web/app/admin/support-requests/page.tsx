"use client";

import { SupportConsole } from "@/src/components/chat/SupportConsole";

export default function SupportRequestsPage() {
    return <SupportConsole basePath="/admin/support-requests" readOnly />;
}
