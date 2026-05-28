"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, LogOut, Trash2 } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import { PiArrowSquareOut } from "react-icons/pi";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { EmployerProfileCard } from "@/src/components/settings/EmployerProfileCard";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { accountApi, type UserRole } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMe } from "@/src/hooks/useMe";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";
import { cn } from "@/src/lib/utils";

export default function SettingsPage() {
    const session = useUserSessionStore((s) => s.session);
    const { me, loading } = useMe();
    const router = useRouter();
    const supabase = createClient();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [soleOwnerMessage, setSoleOwnerMessage] = useState<string | null>(
        null,
    );

    async function handleSignOut() {
        await supabase.auth.signOut();
        router.replace("/");
        router.refresh();
    }

    async function handleDelete() {
        setDeleting(true);
        try {
            await accountApi.deleteAccount();
            await supabase.auth.signOut();
            toast.success("Your account has been deleted.");
            router.replace("/");
            router.refresh();
        } catch (err) {
            // Sole-owner-of-a-company case is the one path the user can
            // actually act on, so surface it as a dedicated dialog with the
            // company names baked into the message — a passing toast would
            // be too easy to miss.
            if (err instanceof ApiClientError && err.code === "SOLE_OWNER") {
                setSoleOwnerMessage(err.message);
                setConfirmDelete(false);
            } else {
                toast.error(
                    err instanceof ApiClientError
                        ? err.message
                        : "Couldn't delete your account. Try again.",
                );
                setConfirmDelete(false);
            }
        } finally {
            setDeleting(false);
        }
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
            <section className="rounded-lg border border-border bg-card overflow-hidden">
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

            <section className="rounded-lg border border-border bg-card overflow-hidden">
                <header className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                        <h2 className="text-[14px] font-semibold">Sign out</h2>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                            End your session on this device.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={handleSignOut}
                        className="h-9 px-3.5 text-[12.5px] cursor-pointer bg-red-600"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign out
                    </Button>
                </header>
            </section>

            <section className="rounded-lg border border-destructive/30 bg-destructive/5 overflow-hidden">
                <header className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                        <h2 className="text-[14px] font-semibold text-destructive">
                            Delete account
                        </h2>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                            Removes your profile and listings from public view.
                            This can&rsquo;t be undone.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="h-9 px-3.5 text-[12.5px] cursor-pointer bg-red-600"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                    </Button>
                </header>
            </section>

            <ConfirmDialog
                open={confirmDelete}
                title="Delete your account?"
                description="You'll be removed from every team you're on, your profile and personal data will be wiped, and you'll be signed out immediately. Listings you posted stay with the company so your teammates can keep using them. This can't be undone."
                confirmLabel="Yes, delete my account"
                cancelLabel="Cancel"
                variant="destructive"
                busy={deleting}
                onCancel={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
            />

            <ConfirmDialog
                open={soleOwnerMessage !== null}
                title="You're the only owner of a company"
                description={
                    soleOwnerMessage ??
                    "Transfer ownership to a teammate or close the company before deleting your account."
                }
                confirmLabel="Open Company settings"
                cancelLabel="Not now"
                onCancel={() => setSoleOwnerMessage(null)}
                onConfirm={() => {
                    setSoleOwnerMessage(null);
                    router.push("/home/company");
                }}
            />
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
