"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, LogOut } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import { PiArrowSquareOut } from "react-icons/pi";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { EmployerProfileCard } from "@/src/components/settings/EmployerProfileCard";
import { Button } from "@/src/components/ui/button";
import type { UserRole } from "@/src/lib/api";
import { useMe } from "@/src/hooks/useMe";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";
import { cn } from "@/src/lib/utils";

export default function SettingsPage() {
    const session = useUserSessionStore((s) => s.session);
    const { me, loading } = useMe();
    const router = useRouter();
    const supabase = createClient();

    async function handleSignOut() {
        await supabase.auth.signOut();
        router.replace("/");
        router.refresh();
    }

    const name = me?.name ?? session?.user?.name ?? "—";
    const email = me?.email ?? session?.user?.email ?? "—";
    const image = me?.image ?? session?.user?.image ?? null;
    const role = me?.role ?? null;

    return (
        <EmptySection
            title="Settings"
            description="Your account information and preferences."
        >
            <section className="rounded-xl border border-border bg-card overflow-hidden">
                <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                    <h2 className="text-[14px] font-semibold">Account</h2>
                </header>

                <div className="px-5 py-5 flex items-start gap-4">
                    <Avatar name={name} image={image} loading={loading} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-semibold truncate">
                                {loading ? (
                                    <span className="inline-block h-4 w-32 rounded-md bg-secondary animate-pulse" />
                                ) : (
                                    name
                                )}
                            </span>
                            {role && <RoleBadge role={role} />}
                        </div>
                        <p className="mt-1 text-[12.5px] text-muted-foreground truncate">
                            {loading ? (
                                <span className="inline-block h-3 w-48 rounded-md bg-secondary animate-pulse" />
                            ) : (
                                email
                            )}
                        </p>
                        {me && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                                <ProfileChip
                                    label="Student profile"
                                    on={me.hasStudentProfile}
                                />
                                <ProfileChip
                                    label="Employer profile"
                                    on={me.hasEmployerProfile}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-5 pb-5">
                    <Link
                        href="/home/profile"
                        className={cn(
                            "inline-flex items-center gap-1.5",
                            "text-[12.5px] font-medium text-brand hover:underline",
                        )}
                    >
                        Edit profile
                        <PiArrowSquareOut className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </section>

            {role === "EMPLOYER" && <EmployerProfileCard />}

            <section className="rounded-xl border border-border bg-card overflow-hidden">
                <header className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                        <h2 className="text-[14px] font-semibold">Sign out</h2>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                            End your session on this device.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="exec-light"
                        onClick={handleSignOut}
                        className="h-9 px-3 text-[12.5px] cursor-pointer"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign out
                    </Button>
                </header>
            </section>
        </EmptySection>
    );
}

function Avatar({
    name,
    image,
    loading,
}: {
    name: string;
    image: string | null;
    loading: boolean;
}) {
    if (loading) {
        return (
            <span className="h-14 w-14 rounded-full bg-secondary animate-pulse shrink-0" />
        );
    }
    if (image) {
        return (
            <span className="relative h-14 w-14 rounded-full overflow-hidden ring-1 ring-border shrink-0">
                <Image
                    src={image}
                    alt={name}
                    fill
                    unoptimized
                    className="object-cover"
                />
            </span>
        );
    }
    return (
        <span
            className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center shrink-0",
                "bg-linear-to-br from-pink-400 to-violet-500",
                "text-white text-[20px] font-semibold ring-1 ring-border",
            )}
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function RoleBadge({ role }: { role: UserRole }) {
    const styles: Record<UserRole, string> = {
        STUDENT: "bg-brand/10 text-brand border-brand/20",
        EMPLOYER: "bg-emerald-50 text-emerald-700 border-emerald-200",
        ADMIN: "bg-amber-50 text-amber-700 border-amber-200",
    };
    const labels: Record<UserRole, string> = {
        STUDENT: "Student",
        EMPLOYER: "Employer",
        ADMIN: "Admin",
    };
    return (
        <span
            className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                styles[role],
            )}
        >
            {labels[role]}
        </span>
    );
}

function ProfileChip({ label, on }: { label: string; on: boolean }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 border",
                on
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-border bg-secondary/40 text-muted-foreground",
            )}
        >
            {on ? (
                <Check className="h-3 w-3" />
            ) : (
                <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
            )}
            {label}
        </span>
    );
}
