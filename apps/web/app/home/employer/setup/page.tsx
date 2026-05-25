"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Building2, Check, UserCog } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import {
    companyApi,
    employerApi,
    type Company,
    type CompanyInput,
    type CompanyUpdateInput,
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

    const existingCompany = memberships[0]?.company ?? null;
    const isRejected = existingCompany?.verificationStatus === "REJECTED";

    // Resume mid-setup:
    //  - REJECTED → stay on the company step so the founder can edit & resubmit.
    //  - APPROVED / PENDING (already submitted) → bounce to dashboard, the
    //    navbar pill is now the source of truth for their status.
    //  - No company yet → land them on profile or company depending on what's
    //    already saved.
    useEffect(() => {
        if (loading || bootstrapped) return;
        if (profile && existingCompany) {
            if (existingCompany.verificationStatus === "REJECTED") {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setStep("company");
                setBootstrapped(true);
                return;
            }
            router.replace("/home/dashboard");
            return;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (profile) setStep("company");

        setBootstrapped(true);
    }, [loading, profile, existingCompany, bootstrapped, router]);

    return (
        <div className="min-h-[calc(100vh-3.25rem)] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-2xl">
                <header className="text-center mb-6">
                    <h1 className="text-[26px] font-semibold tracking-tight">
                        {isRejected
                            ? "Update your company details"
                            : "Set up your employer account"}
                    </h1>
                    <p className="mt-1.5 text-[13px] text-muted-foreground">
                        {isRejected
                            ? "Fix the items below and resubmit — admin will review again."
                            : "Two quick steps — your personal info, then your company. You can edit either later."}
                    </p>
                    {!isRejected && <Stepper current={step} />}
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
                            existing={existingCompany}
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
            <StepPill
                on={true}
                active={current === "profile"}
                icon={<UserCog className="h-3 w-3" />}
                label="Your details"
            />
            <span className="h-px w-6 bg-border" />
            <StepPill
                on={current === "company"}
                active={current === "company"}
                icon={<Building2 className="h-3 w-3" />}
                label="Company"
            />
        </div>
    );
}

function StepPill({
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
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 shadow-2xs shadow-black/5",
                active
                    ? "bg-brand text-white"
                    : on
                      ? "bg-emerald-700 text-white"
                      : "bg-secondary text-muted-foreground",
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

    function set<K extends keyof EmployerProfileInput>(
        k: K,
        v: EmployerProfileInput[K],
    ) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    async function submit() {
        if (!form.firstName?.trim()) {
            toast.error("Please add your first name.");
            return;
        }
        if (!form.jobTitle?.trim()) {
            toast.error("Please add your job title at the company.");
            return;
        }
        setSaving(true);
        try {
            await employerApi.create({
                firstName: form.firstName.trim(),
                lastName: form.lastName?.trim() || undefined,
                phone: form.phone?.trim() || undefined,
                jobTitle: form.jobTitle?.trim() || undefined,
            });
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
                <Field
                    label="Job title"
                    required
                    hint="What you do at your company."
                >
                    <input
                        type="text"
                        value={form.jobTitle ?? ""}
                        onChange={(e) => set("jobTitle", e.target.value)}
                        placeholder="Talent Lead"
                        className={inputCls()}
                    />
                </Field>
            </div>

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

const TEAM_SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "500+"];

function CompanyStep({
    existing,
    onSaved,
}: {
    existing: Company | null;
    onSaved: () => Promise<void>;
}) {
    const [form, setForm] = useState({
        name: existing?.name ?? "",
        slug: existing?.slug ?? "",
        website: existing?.website ?? "",
        linkedinUrl: existing?.linkedinUrl ?? "",
        foundingYear: existing?.foundingYear?.toString() ?? "",
        about: existing?.about ?? "",
        industry: existing?.industry ?? "",
        size: existing?.size ?? "",
        city: existing?.city ?? "",
    });
    const [slugDirty, setSlugDirty] = useState(!!existing?.slug);
    const [saving, setSaving] = useState(false);

    const isEditing = !!existing;
    const isRejected = existing?.verificationStatus === "REJECTED";

    const currentYear = useMemo(() => new Date().getUTCFullYear(), []);

    function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    function onNameChange(value: string) {
        set("name", value);
        if (!slugDirty) set("slug", slugify(value));
    }

    function validate(): string | null {
        if (!form.name.trim()) return "Please add your company name.";
        if (!isEditing) {
            if (!form.slug.trim()) return "Please add a public URL slug.";
            if (!/^[a-z0-9-]+$/.test(form.slug.trim())) {
                return "URL slug can only have lowercase letters, numbers, and hyphens.";
            }
        }
        if (!form.linkedinUrl.trim()) {
            return "LinkedIn URL is required — admin uses it to verify your company.";
        }
        if (!isValidUrl(form.linkedinUrl.trim())) {
            return "That LinkedIn URL doesn’t look right. Include https:// at the start.";
        }
        if (form.website.trim() && !isValidUrl(form.website.trim())) {
            return "That website URL doesn’t look right. Include https:// at the start.";
        }
        const year = Number(form.foundingYear);
        if (!form.foundingYear.trim() || !Number.isInteger(year)) {
            return "Please add your founding year.";
        }
        if (year < 1800 || year > currentYear) {
            return `Founding year must be between 1800 and ${currentYear}.`;
        }
        if (!form.size.trim()) return "Please pick your team size.";
        if (!form.about.trim()) {
            return "Add a short blurb about what your company does.";
        }
        return null;
    }

    async function submit() {
        const err = validate();
        if (err) {
            toast.error(err);
            return;
        }
        setSaving(true);
        try {
            if (isEditing && existing) {
                const input: CompanyUpdateInput = {
                    name: form.name.trim(),
                    website: form.website.trim() || undefined,
                    linkedinUrl: form.linkedinUrl.trim(),
                    foundingYear: Number(form.foundingYear),
                    about: form.about.trim(),
                    industry: form.industry.trim() || undefined,
                    size: form.size.trim(),
                    city: form.city.trim() || undefined,
                };
                await companyApi.update(existing.id, input);
                toast.success(
                    isRejected
                        ? "Resubmitted for review — we’ll notify you when admin decides."
                        : "Saved.",
                );
            } else {
                const input: CompanyInput = {
                    name: form.name.trim(),
                    slug: form.slug.trim(),
                    website: form.website.trim() || undefined,
                    linkedinUrl: form.linkedinUrl.trim(),
                    foundingYear: Number(form.foundingYear),
                    about: form.about.trim(),
                    industry: form.industry.trim() || undefined,
                    size: form.size.trim(),
                    city: form.city.trim() || undefined,
                };
                await companyApi.create(input);
                toast.success(
                    "Submitted for verification — usually under 24 hours.",
                );
            }
            await onSaved();
        } catch (err) {
            toast.error(humanizeError(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            {isRejected && existing?.rejectionNote && (
                <RejectionBanner note={existing.rejectionNote} />
            )}
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
                        disabled={isEditing}
                        className={cn(
                            inputCls(),
                            isEditing && "opacity-60 cursor-not-allowed",
                        )}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="LinkedIn URL" required>
                    <input
                        type="url"
                        value={form.linkedinUrl}
                        onChange={(e) => set("linkedinUrl", e.target.value)}
                        placeholder="https://linkedin.com/company/acme"
                        className={inputCls()}
                    />
                </Field>
                <Field label="Website">
                    <input
                        type="url"
                        value={form.website}
                        onChange={(e) => set("website", e.target.value)}
                        placeholder="https://acme.com"
                        className={inputCls()}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Founding year" required>
                    <input
                        type="number"
                        min={1800}
                        max={currentYear}
                        value={form.foundingYear}
                        onChange={(e) => set("foundingYear", e.target.value)}
                        placeholder="2022"
                        className={inputCls()}
                    />
                </Field>
                <Field label="Team size" required>
                    <select
                        value={form.size}
                        onChange={(e) => set("size", e.target.value)}
                        className={cn(inputCls(), "appearance-none pr-8")}
                    >
                        <option value="" disabled>
                            Pick one
                        </option>
                        {TEAM_SIZE_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="City">
                    <input
                        type="text"
                        value={form.city}
                        onChange={(e) => set("city", e.target.value)}
                        placeholder="Bengaluru"
                        className={inputCls()}
                    />
                </Field>
            </div>
            <Field label="Industry">
                <input
                    type="text"
                    value={form.industry}
                    onChange={(e) => set("industry", e.target.value)}
                    placeholder="Fintech, EdTech, SaaS…"
                    className={inputCls()}
                />
            </Field>
            <Field
                label="About"
                required
                hint="A short blurb that goes on your public company page."
            >
                <textarea
                    value={form.about}
                    onChange={(e) => set("about", e.target.value)}
                    placeholder="What does your company do?"
                    rows={3}
                    maxLength={400}
                    className={cn(inputCls(), "min-h-20 py-2 resize-y")}
                />
                <div className="mt-1 text-right text-[11px] text-muted-foreground tabular-nums">
                    {form.about.length}/400
                </div>
            </Field>

            <div className="flex items-center justify-end pt-2">
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={submit}
                    disabled={saving}
                    className="h-10 px-4 text-[13px] cursor-pointer"
                >
                    {saving
                        ? "Saving…"
                        : isRejected
                          ? "Resubmit for review"
                          : isEditing
                            ? "Save changes"
                            : "Submit for verification"}
                </Button>
            </div>
        </div>
    );
}

/* ------------------------------- helpers --------------------------------- */

function RejectionBanner({ note }: { note: string }) {
    return (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50 px-3.5 py-3 text-[12.5px]">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-700" />
            <div className="space-y-1">
                <div className="font-medium text-amber-900">
                    Admin asked you to update this submission
                </div>
                <p className="text-amber-900/90 leading-relaxed">{note}</p>
            </div>
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

function isValidUrl(value: string): boolean {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

function humanizeError(err: unknown): string {
    if (err instanceof ApiClientError) {
        // Backend already produces readable messages for SLUG_TAKEN /
        // INVALID_REQUEST / FORBIDDEN — surface them verbatim. The Info icon
        // / generic fallback stays for unknown shapes.
        if (err.code === "SLUG_TAKEN") {
            return "A company with this URL is already registered. Try a different one.";
        }
        return err.message;
    }
    return "Couldn’t save. Try again.";
}
