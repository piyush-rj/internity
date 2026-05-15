"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, Info, UserCog } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import {
    companyApi,
    employerApi,
    type CompanyInput,
    type EmployerProfileInput,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { useMeStore } from "@/src/store/useMeStore";
import { cn } from "@/src/lib/utils";

type Step = "profile" | "company";

export default function EmployerSetupPage() {
    const router = useRouter();
    const { profile, memberships, loading, refetch } = useMyEmployer();
    const refetchMe = useMeStore((s) => s.refetch);

    const [step, setStep] = useState<Step>("profile");
    const [bootstrapped, setBootstrapped] = useState(false);

    // Resume mid-setup: skip the profile step if it already exists, and short-
    // circuit straight to the dashboard if there's already a company too.
    useEffect(() => {
        if (loading || bootstrapped) return;
        if (profile && memberships.length > 0) {
            router.replace("/home/dashboard");
            return;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (profile) setStep("company");

        setBootstrapped(true);
    }, [loading, profile, memberships, bootstrapped, router]);

    return (
        <div className="min-h-[calc(100vh-3.25rem)] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-2xl">
                <header className="text-center mb-6">
                    <h1 className="text-[26px] font-semibold tracking-tight">
                        Set up your employer account
                    </h1>
                    <p className="mt-1.5 text-[13px] text-muted-foreground">
                        Two quick steps — your personal info, then your company.
                        You can edit either later.
                    </p>
                    <Stepper current={step} />
                </header>

                <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                    {loading && !bootstrapped ? (
                        <FormSkeleton />
                    ) : step === "profile" ? (
                        <ProfileStep
                            onSaved={async () => {
                                await refetch();
                                setStep("company");
                            }}
                        />
                    ) : (
                        <CompanyStep
                            onSaved={async () => {
                                await Promise.all([refetch(), refetchMe()]);
                                router.replace("/home/dashboard");
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/* --------------------------------- Stepper -------------------------------- */

function Stepper({ current }: { current: Step }) {
    return (
        <div className="mt-4 flex items-center justify-center gap-2 text-[12px]">
            <Pill
                on={true}
                active={current === "profile"}
                icon={<UserCog className="h-3 w-3" />}
                label="Your details"
            />
            <span className="h-px w-6 bg-border" />
            <Pill
                on={current === "company"}
                active={current === "company"}
                icon={<Building2 className="h-3 w-3" />}
                label="Company"
            />
        </div>
    );
}

function Pill({
    on,
    active,
    icon,
    label,
}: {
    on: boolean;
    active: boolean;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border",
                active
                    ? "bg-brand/10 text-brand border-brand/20"
                    : on
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-secondary text-muted-foreground border-border",
            )}
        >
            {on && !active ? <Check className="h-3 w-3" /> : icon}
            {label}
        </span>
    );
}

/* ------------------------------ Profile step ----------------------------- */

function ProfileStep({ onSaved }: { onSaved: () => Promise<void> }) {
    const [form, setForm] = useState<EmployerProfileInput>({
        firstName: "",
        lastName: "",
        phone: "",
        jobTitle: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set<K extends keyof EmployerProfileInput>(
        k: K,
        v: EmployerProfileInput[K],
    ) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    async function submit() {
        if (!form.firstName?.trim()) {
            setError("First name is required.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await employerApi.create({
                firstName: form.firstName.trim(),
                lastName: form.lastName?.trim() || undefined,
                phone: form.phone?.trim() || undefined,
                jobTitle: form.jobTitle?.trim() || undefined,
            });
            await onSaved();
        } catch (err) {
            setError(
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
                        value={form.lastName ?? ""}
                        onChange={(e) => set("lastName", e.target.value)}
                        placeholder="Sharma"
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
                        placeholder="+91 98765 43210"
                        autoComplete="tel"
                        className={inputCls()}
                    />
                </Field>
                <Field label="Job title" hint="What you do at your company.">
                    <input
                        type="text"
                        value={form.jobTitle ?? ""}
                        onChange={(e) => set("jobTitle", e.target.value)}
                        placeholder="Talent Lead"
                        className={inputCls()}
                    />
                </Field>
            </div>

            {error && <FormError message={error} />}

            <div className="flex items-center justify-end pt-2">
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={submit}
                    disabled={saving}
                    className="h-10 px-4 text-[13px] cursor-pointer"
                >
                    {saving ? "Saving…" : "Continue"}
                </Button>
            </div>
        </div>
    );
}

/* ------------------------------ Company step ----------------------------- */

function CompanyStep({ onSaved }: { onSaved: () => Promise<void> }) {
    const [form, setForm] = useState<CompanyInput>({
        name: "",
        slug: "",
        website: "",
        about: "",
        industry: "",
        size: "",
        city: "",
    });
    const [slugDirty, setSlugDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set<K extends keyof CompanyInput>(k: K, v: CompanyInput[K]) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    function onNameChange(value: string) {
        set("name", value);
        if (!slugDirty) set("slug", slugify(value));
    }

    async function submit() {
        if (!form.name.trim()) {
            setError("Company name is required.");
            return;
        }
        if (!form.slug.trim()) {
            setError("Company slug is required.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await companyApi.create({
                name: form.name.trim(),
                slug: form.slug.trim(),
                website: form.website?.trim() || undefined,
                about: form.about?.trim() || undefined,
                industry: form.industry?.trim() || undefined,
                size: form.size?.trim() || undefined,
                city: form.city?.trim() || undefined,
            });
            await onSaved();
        } catch (err) {
            setError(
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
                <Field label="Company name" required>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Acme Pvt Ltd"
                        className={inputCls()}
                    />
                </Field>
                <Field
                    label="Public URL"
                    hint="internity.in/company/<slug>"
                    required
                >
                    <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => {
                            setSlugDirty(true);
                            set("slug", slugify(e.target.value));
                        }}
                        placeholder="acme-pvt-ltd"
                        className={inputCls()}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Website">
                    <input
                        type="url"
                        value={form.website ?? ""}
                        onChange={(e) => set("website", e.target.value)}
                        placeholder="https://acme.com"
                        className={inputCls()}
                    />
                </Field>
                <Field label="City">
                    <input
                        type="text"
                        value={form.city ?? ""}
                        onChange={(e) => set("city", e.target.value)}
                        placeholder="Bengaluru"
                        className={inputCls()}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Industry">
                    <input
                        type="text"
                        value={form.industry ?? ""}
                        onChange={(e) => set("industry", e.target.value)}
                        placeholder="Fintech, EdTech, SaaS…"
                        className={inputCls()}
                    />
                </Field>
                <Field label="Team size">
                    <input
                        type="text"
                        value={form.size ?? ""}
                        onChange={(e) => set("size", e.target.value)}
                        placeholder="1–10, 11–50, 51–200…"
                        className={inputCls()}
                    />
                </Field>
            </div>
            <Field
                label="About"
                hint="A short blurb that goes on your public company page."
            >
                <textarea
                    value={form.about ?? ""}
                    onChange={(e) => set("about", e.target.value)}
                    placeholder="What does your company do?"
                    rows={3}
                    maxLength={400}
                    className={cn(inputCls(), "min-h-20 py-2 resize-y")}
                />
                <div className="mt-1 text-right text-[11px] text-muted-foreground tabular-nums">
                    {(form.about ?? "").length}/400
                </div>
            </Field>

            {error && <FormError message={error} />}

            <div className="flex items-center justify-end pt-2">
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={submit}
                    disabled={saving}
                    className="h-10 px-4 text-[13px] cursor-pointer"
                >
                    {saving ? "Saving…" : "Finish setup"}
                </Button>
            </div>
        </div>
    );
}

/* ------------------------------- helpers --------------------------------- */

function FormError({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{message}</span>
        </div>
    );
}

function FormSkeleton() {
    return (
        <div className="animate-pulse space-y-3">
            <div className="h-10 w-full rounded-md bg-secondary" />
            <div className="h-10 w-full rounded-md bg-secondary" />
            <div className="h-10 w-2/3 rounded-md bg-secondary" />
        </div>
    );
}

function slugify(input: string): string {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}
