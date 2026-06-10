"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { PiArrowSquareOut } from "react-icons/pi";
import { Button } from "@/src/components/ui/button";
import { CompanyLogoUpload } from "@/src/components/company/CompanyLogoUpload";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import {
    companyApi,
    type Company,
    type CompanyUpdateInput,
    type OrganizationType,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { COUNTRIES } from "@/src/lib/catalog/countries";
import { INDUSTRIES } from "@/src/lib/catalog/industries";
import { ORG_TYPES, organizationTypeLabel } from "@/src/lib/catalog/orgTypes";
import { cn } from "@/src/lib/utils";

const TEAM_SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "500+"];

export function CompanyInfoCard({
    company,
    canEdit,
    onSaved,
}: {
    company: Company;
    canEdit: boolean;
    onSaved: () => Promise<void> | void;
}) {
    const [editing, setEditing] = useState(false);

    return (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                <h2 className="text-[14px] font-semibold">Company</h2>
                <div className="flex items-center gap-1">
                    <Link
                        href={`/company/${company.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
                    >
                        View public page
                        <PiArrowSquareOut className="h-3 w-3" />
                    </Link>
                    {canEdit && !editing && (
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            aria-label="Edit company"
                            className="ml-1 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </header>

            <div className="px-5 py-5">
                {editing ? (
                    <EditForm
                        company={company}
                        onCancel={() => setEditing(false)}
                        onSaved={async () => {
                            await onSaved();
                            setEditing(false);
                        }}
                    />
                ) : (
                    <ReadView company={company} />
                )}
            </div>
        </section>
    );
}

function ReadView({ company }: { company: Company }) {
    const location = [company.city, company.country].filter(Boolean).join(", ");

    const stats: { label: string; value: React.ReactNode }[] = [];
    if (company.organizationType) {
        stats.push({
            label: "Organization",
            value: organizationTypeLabel(company.organizationType),
        });
    }
    if (company.industry) {
        stats.push({ label: "Industry", value: company.industry });
    }
    if (company.size) {
        stats.push({ label: "Team size", value: `${company.size} people` });
    }
    if (company.foundingYear) {
        stats.push({ label: "Founded", value: String(company.foundingYear) });
    }
    if (location) {
        stats.push({ label: "Location", value: location });
    }
    if (company.website) {
        stats.push({
            label: "Website",
            value: (
                <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground hover:underline"
                >
                    {prettyUrl(company.website)}
                </a>
            ),
        });
    }
    if (company.linkedinUrl) {
        stats.push({
            label: "LinkedIn",
            value: (
                <a
                    href={company.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground hover:underline"
                >
                    View profile
                </a>
            ),
        });
    }

    return (
        <div>
            <div className="flex items-start gap-4">
                <Logo name={company.name} logoUrl={company.logoUrl} />
                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="text-[17px] font-semibold tracking-tight truncate">
                            {company.name}
                        </h3>
                        <span className="text-[12px] text-muted-foreground">
                            /{company.slug}
                        </span>
                    </div>
                    {company.about && (
                        <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed max-w-prose">
                            {company.about}
                        </p>
                    )}
                </div>
            </div>

            {stats.length > 0 && (
                <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4 border-t border-border pt-5">
                    {stats.map((s) => (
                        <div key={s.label} className="min-w-0">
                            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                {s.label}
                            </dt>
                            <dd className="mt-1 text-[13px] font-medium text-foreground truncate">
                                {s.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    );
}

function EditForm({
    company,
    onCancel,
    onSaved,
}: {
    company: Company;
    onCancel: () => void;
    onSaved: () => Promise<void>;
}) {
    const [form, setForm] = useState({
        name: company.name,
        website: company.website ?? "",
        linkedinUrl: company.linkedinUrl ?? "",
        foundingYear: company.foundingYear?.toString() ?? "",
        about: company.about ?? "",
        industry: company.industry ?? "",
        size: company.size ?? "",
        city: company.city ?? "",
        country: company.country ?? "",
        organizationType: (company.organizationType ?? "") as
            | OrganizationType
            | "",
        logoUrl: company.logoUrl ?? "",
    });
    const [saving, setSaving] = useState(false);
    const currentYear = useMemo(() => new Date().getUTCFullYear(), []);

    function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    function validate(): string | null {
        if (!form.name.trim()) return "Please add a company name.";
        if (form.linkedinUrl.trim() && !isValidUrl(form.linkedinUrl.trim())) {
            return "LinkedIn URL doesn’t look right. Include https:// at the start.";
        }
        if (form.website.trim() && !isValidUrl(form.website.trim())) {
            return "Website URL doesn’t look right. Include https:// at the start.";
        }
        const year = Number(form.foundingYear);
        if (!form.foundingYear.trim() || !Number.isInteger(year)) {
            return "Please add your founding year.";
        }
        if (year < 1800 || year > currentYear) {
            return `Founding year must be between 1800 and ${currentYear}.`;
        }
        if (!form.size.trim()) return "Please add your team size.";
        if (!form.organizationType)
            return "Pick what best describes your organization.";
        if (!form.about.trim()) return "Please add a short blurb.";
        return null;
    }

    async function save() {
        const err = validate();
        if (err) {
            toast.error(err);
            return;
        }
        setSaving(true);
        try {
            const input: CompanyUpdateInput = {
                name: form.name.trim(),
                website: form.website.trim() || undefined,
                linkedinUrl: form.linkedinUrl.trim() || undefined,
                foundingYear: Number(form.foundingYear),
                about: form.about.trim(),
                industry: form.industry.trim() || undefined,
                size: form.size.trim(),
                city: form.city.trim() || undefined,
                country: form.country.trim() || undefined,
                organizationType:
                    (form.organizationType as OrganizationType) || undefined,
                logoUrl: form.logoUrl.trim() || undefined,
            };
            await companyApi.update(company.id, input);
            toast.success("Company updated.");
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
        <div className="space-y-5">
            <div className="flex items-end gap-5">
                <CompanyLogoUpload
                    companyId={company.id}
                    name={form.name || company.name}
                    logoUrl={form.logoUrl || null}
                    onUploaded={(url) => set("logoUrl", url)}
                />
                <div className="flex-1 min-w-0">
                    <Field label="Company name" required>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => set("name", e.target.value)}
                            className={inputCls()}
                        />
                    </Field>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Company LinkedIn">
                    <input
                        type="url"
                        value={form.linkedinUrl}
                        onChange={(e) => set("linkedinUrl", e.target.value)}
                        placeholder="https://linkedin.com/company/acme"
                        className={inputCls()}
                    />
                </Field>
                <Field label="Company Website">
                    <input
                        type="url"
                        value={form.website}
                        onChange={(e) => set("website", e.target.value)}
                        placeholder="https://"
                        className={inputCls()}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                <Field label="Industry">
                    <select
                        value={form.industry}
                        onChange={(e) => set("industry", e.target.value)}
                        className={cn(inputCls(), "pr-8 appearance-none")}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Field label="Team size" required>
                    <select
                        value={form.size}
                        onChange={(e) => set("size", e.target.value)}
                        className={cn(inputCls(), "pr-8 appearance-none")}
                    >
                        <option value="" disabled>
                            Pick one
                        </option>
                        {TEAM_SIZE_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                        {form.size &&
                            !TEAM_SIZE_OPTIONS.includes(form.size) && (
                                <option value={form.size}>{form.size}</option>
                            )}
                    </select>
                </Field>
                <Field label="City">
                    <input
                        type="text"
                        value={form.city}
                        onChange={(e) => set("city", e.target.value)}
                        className={inputCls()}
                    />
                </Field>
                <Field label="Country">
                    <select
                        value={form.country}
                        onChange={(e) => set("country", e.target.value)}
                        className={cn(inputCls(), "pr-8 appearance-none")}
                    >
                        <option value="">Pick country</option>
                        {COUNTRIES.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>
            <Field label="What best describes your organization?" required>
                <select
                    value={form.organizationType}
                    onChange={(e) =>
                        set(
                            "organizationType",
                            e.target.value as OrganizationType | "",
                        )
                    }
                    className={cn(inputCls(), "pr-8 appearance-none")}
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
                hint="Add as much detail as possible, a richer, more detailed description attracts more candidates."
            >
                <textarea
                    value={form.about}
                    onChange={(e) => set("about", e.target.value)}
                    rows={3}
                    maxLength={400}
                    className={cn(inputCls(), "min-h-20 py-2 resize-y")}
                />
                <div className="mt-1 text-right text-[11px] text-muted-foreground tabular-nums">
                    {form.about.length}/400
                </div>
            </Field>

            <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                    type="button"
                    variant="exec-light"
                    onClick={onCancel}
                    disabled={saving}
                    className="h-9 px-3 text-[12.5px] cursor-pointer rounded-sm!"
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={save}
                    disabled={saving}
                    className="h-9 px-3 text-[12.5px] cursor-pointer rounded-sm!"
                >
                    {saving ? "Saving…" : "Save changes"}
                </Button>
            </div>
        </div>
    );
}

function isValidUrl(value: string): boolean {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

function Logo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
    if (logoUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={logoUrl}
                alt={`${name} logo`}
                className="h-14 w-14 rounded-md object-cover bg-white ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span
            className={cn(
                "h-14 w-14 rounded-md flex items-center justify-center shrink-0",
                "bg-secondary text-foreground text-[20px] font-semibold ring-1 ring-border",
            )}
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function prettyUrl(url: string): string {
    try {
        return new URL(url).host.replace(/^www\./, "");
    } catch {
        return url;
    }
}
