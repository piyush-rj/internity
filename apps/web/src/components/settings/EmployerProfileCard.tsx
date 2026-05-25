"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { PiBriefcase, PiPhone, PiUser } from "react-icons/pi";
import { Button } from "@/src/components/ui/button";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import {
    employerApi,
    type EmployerProfile,
    type EmployerProfileInput,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { cn } from "@/src/lib/utils";

export function EmployerProfileCard() {
    const { profile, loading, refetch } = useMyEmployer();
    const [editing, setEditing] = useState(false);

    return (
        <section className="rounded-xl border border-border bg-card overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                <div className="min-w-0">
                    <h2 className="text-[14px] font-semibold">
                        Employer profile
                    </h2>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                        How students see you when you review their applications.
                    </p>
                </div>
                {profile && !editing && (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        aria-label="Edit employer profile"
                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                )}
            </header>

            <div className="px-5 py-5">
                {loading && !profile ? (
                    <Skeleton />
                ) : editing && profile ? (
                    <EditForm
                        profile={profile}
                        onCancel={() => setEditing(false)}
                        onSaved={async () => {
                            await refetch();
                            setEditing(false);
                        }}
                    />
                ) : profile ? (
                    <ReadView profile={profile} />
                ) : (
                    <NoProfile />
                )}
            </div>
        </section>
    );
}

function ReadView({ profile }: { profile: EmployerProfile }) {
    const fullName = `${profile.firstName}${profile.lastName ? " " + profile.lastName : ""}`;
    return (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
            <Fact
                icon={<PiUser className="h-3.5 w-3.5" />}
                label="Name"
                value={fullName}
            />
            {profile.jobTitle && (
                <Fact
                    icon={<PiBriefcase className="h-3.5 w-3.5" />}
                    label="Job title"
                    value={profile.jobTitle}
                />
            )}
            {profile.phone && (
                <Fact
                    icon={<PiPhone className="h-3.5 w-3.5" />}
                    label="Phone"
                    value={profile.phone}
                />
            )}
        </dl>
    );
}

function EditForm({
    profile,
    onCancel,
    onSaved,
}: {
    profile: EmployerProfile;
    onCancel: () => void;
    onSaved: () => Promise<void>;
}) {
    const [form, setForm] = useState<EmployerProfileInput>({
        firstName: profile.firstName,
        lastName: profile.lastName ?? "",
        phone: profile.phone ?? "",
        jobTitle: profile.jobTitle ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
    });
    const [saving, setSaving] = useState(false);

    function set<K extends keyof EmployerProfileInput>(
        k: K,
        v: EmployerProfileInput[K],
    ) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    async function save() {
        if (!form.firstName?.trim()) {
            toast.error("Please add your first name.");
            return;
        }
        setSaving(true);
        try {
            await employerApi.update({
                firstName: form.firstName.trim(),
                lastName: form.lastName?.trim() || undefined,
                phone: form.phone?.trim() || undefined,
                jobTitle: form.jobTitle?.trim() || undefined,
                linkedinUrl: form.linkedinUrl?.trim() || undefined,
            });
            toast.success("Saved.");
            await onSaved();
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t save. Try again.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="First name" required>
                    <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => set("firstName", e.target.value)}
                        autoComplete="given-name"
                        className={inputCls()}
                    />
                </Field>
                <Field label="Last name">
                    <input
                        type="text"
                        value={form.lastName ?? ""}
                        onChange={(e) => set("lastName", e.target.value)}
                        autoComplete="family-name"
                        className={inputCls()}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Phone">
                    <input
                        type="tel"
                        value={form.phone ?? ""}
                        onChange={(e) => set("phone", e.target.value)}
                        autoComplete="tel"
                        className={inputCls()}
                    />
                </Field>
                <Field label="Job title">
                    <input
                        type="text"
                        value={form.jobTitle ?? ""}
                        onChange={(e) => set("jobTitle", e.target.value)}
                        className={inputCls()}
                    />
                </Field>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
                <Button
                    type="button"
                    variant="exec-light"
                    onClick={onCancel}
                    disabled={saving}
                    className="h-9 px-3 text-[12.5px] cursor-pointer"
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={save}
                    disabled={saving}
                    className="h-9 px-3 text-[12.5px] cursor-pointer"
                >
                    {saving ? "Saving…" : "Save changes"}
                </Button>
            </div>
        </div>
    );
}

function Fact({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-2 min-w-0">
            <span className="mt-0.5 text-muted-foreground inline-flex h-3.5 w-3.5 items-center justify-center">
                {icon}
            </span>
            <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground">{label}</div>
                <div className="font-medium truncate">{value}</div>
            </div>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="animate-pulse space-y-2">
            <div className="h-3 w-1/3 rounded-full bg-muted" />
            <div className="h-3 w-1/2 rounded-full bg-muted" />
        </div>
    );
}

function NoProfile() {
    return (
        <p className="text-[13px] text-muted-foreground">
            No employer profile yet — finish your{" "}
            <a
                href="/home/employer/setup"
                className={cn("font-medium text-brand hover:underline")}
            >
                setup
            </a>
            .
        </p>
    );
}
