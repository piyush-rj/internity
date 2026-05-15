"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, Pencil } from "lucide-react";
import {
    PiArrowSquareOut,
    PiBuildings,
    PiGlobe,
    PiMapPin,
    PiUsers,
} from "react-icons/pi";
import { Button } from "@/src/components/ui/button";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import { companyApi, type Company, type CompanyInput } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

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
        <section className="rounded-xl border border-border bg-card overflow-hidden">
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
    return (
        <div className="flex items-start gap-4">
            <Logo name={company.name} logoUrl={company.logoUrl} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[16px] font-semibold tracking-tight truncate">
                        {company.name}
                    </h3>
                    <span className="text-[11.5px] text-muted-foreground">
                        /{company.slug}
                    </span>
                </div>
                {company.about && (
                    <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed max-w-prose">
                        {company.about}
                    </p>
                )}
                <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12.5px]">
                    {company.industry && (
                        <Fact
                            icon={<PiBuildings className="h-3.5 w-3.5" />}
                            text={company.industry}
                        />
                    )}
                    {company.size && (
                        <Fact
                            icon={<PiUsers className="h-3.5 w-3.5" />}
                            text={`${company.size} people`}
                        />
                    )}
                    {company.city && (
                        <Fact
                            icon={<PiMapPin className="h-3.5 w-3.5" />}
                            text={company.city}
                        />
                    )}
                    {company.website && (
                        <Fact
                            icon={<PiGlobe className="h-3.5 w-3.5" />}
                            text={
                                <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:underline truncate"
                                >
                                    {prettyUrl(company.website)}
                                </a>
                            }
                        />
                    )}
                </dl>
            </div>
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
    const [form, setForm] = useState<
        Omit<CompanyInput, "slug" | "name"> & {
            name: string;
        }
    >({
        name: company.name,
        website: company.website ?? "",
        about: company.about ?? "",
        industry: company.industry ?? "",
        size: company.size ?? "",
        city: company.city ?? "",
        logoUrl: company.logoUrl ?? "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    async function save() {
        if (!form.name.trim()) {
            setError("Company name is required.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await companyApi.update(company.id, {
                name: form.name.trim(),
                website: form.website?.trim() || undefined,
                about: form.about?.trim() || undefined,
                industry: form.industry?.trim() || undefined,
                size: form.size?.trim() || undefined,
                city: form.city?.trim() || undefined,
                logoUrl: form.logoUrl?.trim() || undefined,
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
            <Field label="Company name" required>
                <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className={inputCls()}
                />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Website">
                    <input
                        type="url"
                        value={form.website ?? ""}
                        onChange={(e) => set("website", e.target.value)}
                        placeholder="https://"
                        className={inputCls()}
                    />
                </Field>
                <Field label="Logo URL">
                    <input
                        type="url"
                        value={form.logoUrl ?? ""}
                        onChange={(e) => set("logoUrl", e.target.value)}
                        placeholder="https://"
                        className={inputCls()}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Industry">
                    <input
                        type="text"
                        value={form.industry ?? ""}
                        onChange={(e) => set("industry", e.target.value)}
                        className={inputCls()}
                    />
                </Field>
                <Field label="Team size">
                    <input
                        type="text"
                        value={form.size ?? ""}
                        onChange={(e) => set("size", e.target.value)}
                        className={inputCls()}
                    />
                </Field>
                <Field label="City">
                    <input
                        type="text"
                        value={form.city ?? ""}
                        onChange={(e) => set("city", e.target.value)}
                        className={inputCls()}
                    />
                </Field>
            </div>
            <Field label="About">
                <textarea
                    value={form.about ?? ""}
                    onChange={(e) => set("about", e.target.value)}
                    rows={3}
                    maxLength={400}
                    className={cn(inputCls(), "min-h-20 py-2 resize-y")}
                />
                <div className="mt-1 text-right text-[11px] text-muted-foreground tabular-nums">
                    {(form.about ?? "").length}/400
                </div>
            </Field>

            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

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

function Fact({
    icon,
    text,
}: {
    icon: React.ReactNode;
    text: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-1.5 text-foreground min-w-0">
            <span className="text-muted-foreground inline-flex h-3.5 w-3.5 items-center justify-center">
                {icon}
            </span>
            <span className="truncate">{text}</span>
        </div>
    );
}

function prettyUrl(url: string): string {
    try {
        return new URL(url).host.replace(/^www\./, "");
    } catch {
        return url;
    }
}
