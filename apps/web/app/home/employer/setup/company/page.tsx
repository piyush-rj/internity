"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import {
    companyApi,
    type CompanyInput,
    type OrganizationType,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMeStore } from "@/src/store/useMeStore";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/src/lib/catalog/countries";
import { INDUSTRIES } from "@/src/lib/catalog/industries";
import { ORG_TYPES } from "@/src/lib/catalog/orgTypes";
import { cn } from "@/src/lib/utils";

const TEAM_SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "500+"];

export default function CreateCompanyPage() {
    const router = useRouter();
    const refetchMe = useMeStore((s) => s.refetch);
    const currentYear = useMemo(() => new Date().getUTCFullYear(), []);

    const [form, setForm] = useState({
        name: "",
        slug: "",
        website: "",
        linkedinUrl: "",
        foundingYear: "",
        about: "",
        industry: "",
        size: "",
        city: "",
        country: DEFAULT_COUNTRY,
        organizationType: "" as OrganizationType | "",
    });
    const [slugDirty, setSlugDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    function onNameChange(value: string) {
        set("name", value);
        if (!slugDirty) set("slug", slugify(value));
    }

    function validate(): string | null {
        if (!form.name.trim()) return "Please add your company name.";
        if (!form.slug.trim()) return "Please add a public URL slug.";
        if (!/^[a-z0-9-]+$/.test(form.slug.trim())) {
            return "URL slug can only have lowercase letters, numbers, and hyphens.";
        }
        if (form.linkedinUrl.trim() && !isValidUrl(form.linkedinUrl.trim())) {
            return "LinkedIn URL doesn't look right. Include https:// at the start.";
        }
        if (form.website.trim() && !isValidUrl(form.website.trim())) {
            return "Website URL doesn't look right. Include https:// at the start.";
        }
        const year = Number(form.foundingYear);
        if (!form.foundingYear.trim() || !Number.isInteger(year)) {
            return "Please add your founding year.";
        }
        if (year < 1800 || year > currentYear) {
            return `Founding year must be between 1800 and ${currentYear}.`;
        }
        if (!form.size.trim()) return "Please pick your team size.";
        if (!form.country.trim()) return "Please pick the company's country.";
        if (!form.organizationType)
            return "Pick what best describes your organization.";
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
            const input: CompanyInput = {
                name: form.name.trim(),
                slug: form.slug.trim(),
                website: form.website.trim() || undefined,
                linkedinUrl: form.linkedinUrl.trim() || undefined,
                foundingYear: Number(form.foundingYear),
                about: form.about.trim(),
                industry: form.industry.trim() || undefined,
                size: form.size.trim(),
                city: form.city.trim() || undefined,
                country: form.country.trim(),
                organizationType: form.organizationType as OrganizationType,
            };
            await companyApi.create(input);
            await refetchMe();
            toast.success("Company created. You can post listings now.");
            router.replace("/home/dashboard");
        } catch (err) {
            toast.error(humanizeError(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-3.25rem)] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-2xl">
                <header className="text-center mb-6">
                    <h1 className="text-[26px] font-semibold tracking-tight">
                        Create your company
                    </h1>
                    <p className="mt-1.5 text-[13px] text-muted-foreground">
                        You can post listings immediately. Verification adds a
                        badge once admin reviews.
                    </p>
                </header>

                <div className="rounded-lg border border-border bg-card p-6 sm:p-8 space-y-4">
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
                            hint="spiderskill.in/company/<slug>"
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
                        <Field
                            label="Company LinkedIn"
                            hint="Optional. Helps with verification."
                        >
                            <input
                                type="url"
                                value={form.linkedinUrl}
                                onChange={(e) =>
                                    set("linkedinUrl", e.target.value)
                                }
                                placeholder="https://linkedin.com/company/acme"
                                className={inputCls()}
                            />
                        </Field>
                        <Field label="Company Website">
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
                                onChange={(e) =>
                                    set("foundingYear", e.target.value)
                                }
                                placeholder="2022"
                                className={inputCls()}
                            />
                        </Field>
                        <Field label="Team size" required>
                            <select
                                value={form.size}
                                onChange={(e) => set("size", e.target.value)}
                                className={cn(
                                    inputCls(),
                                    "appearance-none pr-8",
                                )}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Country" required>
                            <select
                                value={form.country}
                                onChange={(e) => set("country", e.target.value)}
                                className={cn(
                                    inputCls(),
                                    "appearance-none pr-8 cursor-pointer",
                                )}
                            >
                                {COUNTRIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Industry">
                            <select
                                value={form.industry}
                                onChange={(e) =>
                                    set("industry", e.target.value)
                                }
                                className={cn(
                                    inputCls(),
                                    "appearance-none pr-8 cursor-pointer",
                                )}
                            >
                                <option value="">Pick industry</option>
                                {INDUSTRIES.map((i) => (
                                    <option key={i} value={i}>
                                        {i}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>
                    <Field
                        label="What best describes your organization?"
                        required
                    >
                        <select
                            value={form.organizationType}
                            onChange={(e) =>
                                set(
                                    "organizationType",
                                    e.target.value as OrganizationType | "",
                                )
                            }
                            className={cn(
                                inputCls(),
                                "appearance-none pr-8 cursor-pointer",
                            )}
                        >
                            <option value="">Pick one</option>
                            {ORG_TYPES.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
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
                    <div className="flex items-center justify-between pt-2">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back
                        </button>
                        <Button
                            type="button"
                            variant="exec-dark"
                            onClick={submit}
                            disabled={saving}
                            className="h-10 px-4 text-[13px] cursor-pointer"
                        >
                            {saving ? "Creating…" : "Create company"}
                        </Button>
                    </div>
                </div>
            </div>
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
        if (err.code === "SLUG_TAKEN") {
            return "A company with this URL is already registered. Try a different one.";
        }
        return err.message;
    }
    return "Couldn't save. Try again.";
}
