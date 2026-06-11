"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, LifeBuoy } from "lucide-react";
import { supportApi } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMeStore } from "@/src/store/useMeStore";
import {
    getSupportToken,
    setSupportToken,
} from "@/src/lib/supportAuth";

export default function SupportLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Already signed in as the support agent — skip straight to the console.
    useEffect(() => {
        if (getSupportToken()) router.replace("/support");
    }, [router]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await supportApi.login(email.trim(), password);
            setSupportToken(res.token);
            // Load /auth/me with the new token before entering the console.
            await useMeStore.getState().refetch();
            router.replace("/support");
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't sign in. Please try again.",
            );
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center mb-3">
                        <LifeBuoy className="h-6 w-6" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">
                        Support Console
                    </h1>
                    <p className="text-[13px] text-muted-foreground mt-1">
                        Sign in to handle support chats.
                    </p>
                </div>

                <form
                    onSubmit={onSubmit}
                    className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4"
                >
                    <div className="space-y-1.5">
                        <label
                            htmlFor="support-email"
                            className="text-[12.5px] font-medium"
                        >
                            Email
                        </label>
                        <input
                            id="support-email"
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[14px] outline-none focus:ring-2 focus:ring-foreground/10"
                            placeholder="support@spiderskill.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="support-password"
                            className="text-[12.5px] font-medium"
                        >
                            Password
                        </label>
                        <input
                            id="support-password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[14px] outline-none focus:ring-2 focus:ring-foreground/10"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-10 rounded-lg bg-foreground text-background text-[14px] font-medium flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Lock className="h-4 w-4" />
                        )}
                        {submitting ? "Signing in…" : "Sign in"}
                    </button>
                </form>
            </div>
        </main>
    );
}
