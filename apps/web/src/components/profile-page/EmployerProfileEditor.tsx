"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { AvatarUpload } from "@/src/components/profile-page/AvatarUpload";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { useMeStore } from "@/src/store/useMeStore";
import {
    employerApi,
    type EmployerProfile,
    type EmployerProfileInput,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

// edit employer personal profile surface at /home/profile
export function EmployerProfileEditor() {
    const { profile, loading, refetch } = useMyEmployer();
    const me = useMeStore((s) => s.me);
    const refetchMe = useMeStore((s) => s.refetch);

    const displayName =
        [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
        me?.name ||
        me?.email ||
        "You";

    return (
        <div className="mx-auto max-w-3xl px-6 py-8 sm:px-10 space-y-4">
            <header className="space-y-1">
                <h1 className="text-[22px] font-semibold tracking-tight">
                    Your profile
                </h1>
                <p className="text-[13px] text-muted-foreground">
                    Shown to students on listings you post. Company details
                    are managed on{" "}
                    <a
                        href="/home/company"
                        className="text-brand hover:underline"
                    >
                        the Company page
                    </a>
                    .
                </p>
            </header>

            <section className="rounded-lg border border-border bg-card overflow-hidden">
                <header className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="text-[14px] font-semibold">
                        Profile picture
                    </h2>
                </header>
                <div className="px-5 py-5">
                    <AvatarUpload
                        name={displayName}
                        imageUrl={me?.image ?? null}
                        onUploaded={() => {
                            // confirm endpoint already updated User.image —
                            // refetch so the new picture propagates to the
                            // navbar, sidebar, listing detail, etc.
                            void refetchMe();
                        }}
                    />
                </div>
            </section>

            {loading && !profile ? (
                <Skeleton />
            ) : (
                <ProfileCard
                    profile={profile}
                    accountEmail={me?.email ?? null}
                    onSaved={refetch}
                />
            )}
        </div>
    );
}

function ProfileCard({
    profile,
    accountEmail,
    onSaved,
}: {
    profile: EmployerProfile | null;
    accountEmail: string | null;
    onSaved: () => Promise<void> | void;
}) {
    const [editing, setEditing] = useState(!profile);
    return (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-[14px] font-semibold">
                    {profile ? "Personal details" : "Set up your profile"}
                </h2>
                {profile && !editing && (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        aria-label="Edit profile"
                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                )}
            </header>

            <div className="px-5 py-5">
                {editing || !profile ? (
                    <EditForm
                        profile={profile}
                        accountEmail={accountEmail}
                        onCancel={
                            profile ? () => setEditing(false) : undefined
                        }
                        onSaved={async () => {
                            await onSaved();
                            setEditing(false);
                        }}
                    />
                ) : (
                    <ReadView
                        profile={profile}
                        accountEmail={accountEmail}
                    />
                )}
            </div>
        </section>
    );
}

function ReadView({
    profile,
    accountEmail,
}: {
    profile: EmployerProfile;
    accountEmail: string | null;
}) {
    const fullName = [profile.firstName, profile.lastName]
        .filter(Boolean)
        .join(" ");
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
            <Fact label="Name" value={fullName} />
            <Fact label="Job title" value={profile.jobTitle ?? "—"} />
            <Fact label="Phone" value={profile.phone ?? "—"} />
            <Fact label="Email" value={accountEmail ?? "—"} />
            <Fact
                label="LinkedIn"
                value={
                    profile.linkedinUrl ? (
                        <a
                            href={profile.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand hover:underline truncate inline-block max-w-full"
                        >
                            {prettyUrl(profile.linkedinUrl)}
                        </a>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )
                }
            />
        </div>
    );
}

function Fact({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {label}
            </dt>
            <dd className="mt-0.5 font-medium text-foreground truncate">
                {value}
            </dd>
        </div>
    );
}

type FormState = {
    firstName: string;
    lastName: string;
    phone: string;
    jobTitle: string;
    linkedinUrl: string;
};

function EditForm({
    profile,
    accountEmail,
    onCancel,
    onSaved,
}: {
    profile: EmployerProfile | null;
    accountEmail: string | null;
    onCancel?: () => void;
    onSaved: () => Promise<void> | void;
}) {
    const [form, setForm] = useState<FormState>({
        firstName: profile?.firstName ?? "",
        lastName: profile?.lastName ?? "",
        phone: profile?.phone ?? "",
        jobTitle: profile?.jobTitle ?? "",
        linkedinUrl: profile?.linkedinUrl ?? "",
    });
    useEffect(() => {
        if (!profile) return;
        setForm({
            firstName: profile.firstName ?? "",
            lastName: profile.lastName ?? "",
            phone: profile.phone ?? "",
            jobTitle: profile.jobTitle ?? "",
            linkedinUrl: profile.linkedinUrl ?? "",
        });
    }, [profile?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

    const [saving, setSaving] = useState(false);

    function set<K extends keyof FormState>(k: K, v: FormState[K]) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    async function save() {
        if (!form.firstName.trim()) {
            toast.error("Please add your first name.");
            return;
        }
        if (!form.jobTitle.trim()) {
            toast.error("Please add your job title at the company.");
            return;
        }
        const linkedin = form.linkedinUrl.trim();
        if (linkedin && !isHttpUrl(linkedin)) {
            toast.error(
                "LinkedIn URL doesn’t look right. Include https:// at the start.",
            );
            return;
        }
        setSaving(true);
        try {
            const input: EmployerProfileInput = {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim() || undefined,
                phone: form.phone.trim() || undefined,
                jobTitle: form.jobTitle.trim(),
                linkedinUrl: linkedin || undefined,
            };
            if (profile) await employerApi.update(input);
            else await employerApi.create(input);
            toast.success("Profile saved.");
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
                        placeholder="Priya"
                        autoComplete="given-name"
                        className={inputCls()}
                    />
                </Field>
                <Field label="Last name">
                    <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => set("lastName", e.target.value)}
                        placeholder="Sharma"
                        autoComplete="family-name"
                        className={inputCls()}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                    label="Job title"
                    required
                    hint="Shown next to your name on listings."
                >
                    <input
                        type="text"
                        value={form.jobTitle}
                        onChange={(e) => set("jobTitle", e.target.value)}
                        placeholder="Talent Lead"
                        className={inputCls()}
                    />
                </Field>
                <Field label="Phone">
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                        autoComplete="tel"
                        className={inputCls()}
                    />
                </Field>
            </div>
            <Field
                label="LinkedIn URL"
                hint="Builds trust with students. Optional but recommended."
            >
                <input
                    type="url"
                    value={form.linkedinUrl}
                    onChange={(e) => set("linkedinUrl", e.target.value)}
                    placeholder="https://linkedin.com/in/your-handle"
                    className={inputCls()}
                />
            </Field>

            {accountEmail && (
                <div className="text-[11.5px] text-muted-foreground">
                    Account email:{" "}
                    <span className="text-foreground/80">{accountEmail}</span>
                </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
                {onCancel && (
                    <Button
                        type="button"
                        variant="exec-light"
                        onClick={onCancel}
                        disabled={saving}
                        className="h-9 px-3 text-[12.5px] cursor-pointer"
                    >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                    </Button>
                )}
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={save}
                    disabled={saving}
                    className="h-9 px-3 text-[12.5px] cursor-pointer"
                >
                    {saving ? "Saving…" : profile ? "Save changes" : "Create profile"}
                </Button>
            </div>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="rounded-lg border border-border bg-card p-5 animate-pulse space-y-3">
            <div className="h-4 w-1/3 rounded-md bg-secondary" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="h-10 w-full rounded-md bg-secondary" />
                <div className="h-10 w-full rounded-md bg-secondary" />
                <div className="h-10 w-full rounded-md bg-secondary" />
                <div className="h-10 w-full rounded-md bg-secondary" />
            </div>
        </div>
    );
}

function isHttpUrl(value: string): boolean {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

function prettyUrl(url: string): string {
    try {
        return new URL(url).host.replace(/^www\./, "") + new URL(url).pathname;
    } catch {
        return url;
    }
}
