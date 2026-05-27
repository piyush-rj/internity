"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Mail, SkipForward } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { invitationApi } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMeStore } from "@/src/store/useMeStore";
import { cn } from "@/src/lib/utils";

// Junction shown after employer profile setup: pick whether to create a
// new company, join an existing one via invite, or skip and explore the
// dashboard first. A user can return here from the sidebar later.
export default function EmployerOnboardPage() {
    const router = useRouter();
    const refetchMe = useMeStore((s) => s.refetch);
    const [showInvite, setShowInvite] = useState(false);
    const [token, setToken] = useState("");
    const [accepting, setAccepting] = useState(false);

    async function joinViaInvite() {
        const raw = token.trim();
        if (!raw) {
            toast.error("Paste the invite link or token.");
            return;
        }
        // Accept either the bare token or a full URL like /invite/<token>
        const t = raw.includes("/invite/")
            ? raw.split("/invite/")[1]!.split(/[?#]/)[0]!
            : raw;
        setAccepting(true);
        try {
            await invitationApi.accept(t);
            await refetchMe();
            toast.success("Joined the company.");
            router.replace("/home/dashboard");
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't accept that invite.",
            );
        } finally {
            setAccepting(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-3.25rem)] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-2xl">
                <header className="text-center mb-6">
                    <h1 className="text-[26px] font-semibold tracking-tight">
                        Connect a company
                    </h1>
                    <p className="mt-1.5 text-[13px] text-muted-foreground">
                        You can create a new company, join an existing one via
                        invite, or do this later.
                    </p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                        href="/home/employer/setup/company"
                        className="rounded-lg border border-border bg-card p-5 hover:bg-secondary/40 transition-colors cursor-pointer"
                    >
                        <div className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-brand/10 text-brand">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <h2 className="mt-3 text-[15px] font-semibold">
                            Create a new company
                        </h2>
                        <p className="mt-1 text-[12.5px] text-muted-foreground leading-relaxed">
                            Add your company details so you can post listings
                            and invite teammates.
                        </p>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setShowInvite((v) => !v)}
                        className={cn(
                            "text-left rounded-lg border border-border bg-card p-5 hover:bg-secondary/40 transition-colors cursor-pointer",
                            showInvite && "ring-2 ring-foreground/20",
                        )}
                    >
                        <div className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-sky-100 text-sky-700">
                            <Mail className="h-5 w-5" />
                        </div>
                        <h2 className="mt-3 text-[15px] font-semibold">
                            Join via invite
                        </h2>
                        <p className="mt-1 text-[12.5px] text-muted-foreground leading-relaxed">
                            Paste an invite link your teammate sent you to join
                            their company.
                        </p>
                    </button>
                </div>

                {showInvite && (
                    <div className="mt-3 rounded-lg border border-border bg-card p-4 space-y-3">
                        <label className="block space-y-1">
                            <span className="block text-[12.5px] font-medium">
                                Invite link or token
                            </span>
                            <input
                                type="text"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="https://… /invite/abc123"
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5"
                            />
                        </label>
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="exec-dark"
                                onClick={joinViaInvite}
                                disabled={accepting}
                                className="h-9 px-4 text-[12.5px] cursor-pointer"
                            >
                                {accepting ? "Joining…" : "Accept invite"}
                            </Button>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-center">
                    <Link
                        href="/home/dashboard"
                        className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
                    >
                        <SkipForward className="h-3.5 w-3.5" />
                        Skip for now &mdash; I&rsquo;ll do this later
                    </Link>
                </div>
            </div>
        </div>
    );
}
