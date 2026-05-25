"use client";

import { useSearchParams } from "next/navigation";
import { AuthFlow } from "@/src/components/auth/AuthFlow";

export function LoginPageContent() {
    const searchParams = useSearchParams();
    const next = searchParams.get("next") ?? "/home/dashboard";

    return (
        <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-neutral-50">
            <div className="w-full max-w-[400px] rounded-lg bg-white p-6 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.12)] ring-1 ring-black/5">
                <AuthFlow nextPath={next} />
            </div>
        </main>
    );
}
