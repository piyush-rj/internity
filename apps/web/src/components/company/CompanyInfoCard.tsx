"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Upload } from "lucide-react";
import {
    PiArrowSquareOut,
    PiBuildings,
    PiGlobe,
    PiMapPin,
    PiUsers,
} from "react-icons/pi";
import { Button } from "@/src/components/ui/button";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import {
    companyApi,
    type Company,
    type CompanyUpdateInput,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { uploadAsset } from "@/src/lib/upload";
import { cn } from "@/src/lib/utils";

const LOGO_ACCEPT = "image/png,image/jpeg,image/webp";
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

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
    const [form, setForm] = useState({
        name: company.name,
        website: company.website ?? "",
        linkedinUrl: company.linkedinUrl ?? "",
        foundingYear: company.foundingYear?.toString() ?? "",
        about: company.about ?? "",
        industry: company.industry ?? "",
        size: company.size ?? "",
        city: company.city ?? "",
        logoUrl: company.logoUrl ?? "",
    });
    const [saving, setSaving] = useState(false);
    const currentYear = useMemo(() => new Date().getUTCFullYear(), []);

    function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    function validate(): string | null {
        if (!form.name.trim()) return "Please add a company name.";
        if (!form.linkedinUrl.trim()) return "LinkedIn URL is required.";
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
                linkedinUrl: form.linkedinUrl.trim(),
                foundingYear: Number(form.foundingYear),
                about: form.about.trim(),
                industry: form.industry.trim() || undefined,
                size: form.size.trim(),
                city: form.city.trim() || undefined,
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
                        placeholder="https://"
                        className={inputCls()}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <Field label="Logo">
                    <LogoUpload
                        companyId={company.id}
                        name={form.name || company.name}
                        logoUrl={form.logoUrl || null}
                        onUploaded={(url) => set("logoUrl", url)}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Industry">
                    <input
                        type="text"
                        value={form.industry}
                        onChange={(e) => set("industry", e.target.value)}
                        className={inputCls()}
                    />
                </Field>
                <Field label="Team size" required>
                    <input
                        type="text"
                        value={form.size}
                        onChange={(e) => set("size", e.target.value)}
                        className={inputCls()}
                    />
                </Field>
                <Field label="City">
                    <input
                        type="text"
                        value={form.city}
                        onChange={(e) => set("city", e.target.value)}
                        className={inputCls()}
                    />
                </Field>
            </div>
            <Field label="About" required>
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

function isValidUrl(value: string): boolean {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

function LogoUpload({
    companyId,
    name,
    logoUrl,
    onUploaded,
}: {
    companyId: string;
    name: string;
    logoUrl: string | null;
    onUploaded: (url: string) => void;
}) {
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);

    async function handleFile(file: File) {
        if (!file.type || !LOGO_ACCEPT.split(",").includes(file.type)) {
            toast.error("Please pick a PNG, JPG, or WEBP image.");
            return;
        }
        if (file.size > LOGO_MAX_BYTES) {
            toast.error("Logo must be under 2 MB.");
            return;
        }
        if (file.size === 0) {
            toast.error("That file looks empty.");
            return;
        }
        setUploading(true);
        try {
            const { getUrl } = await uploadAsset({
                kind: "COMPANY_LOGO",
                file,
                companyId,
            });
            onUploaded(getUrl);
            toast.success("Logo uploaded.");
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : "Upload failed.",
            );
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    return (
        <div className="flex items-center gap-3">
            <Logo name={name} logoUrl={logoUrl} />
            <div className="flex flex-col gap-1.5 min-w-0">
                <Button
                    type="button"
                    variant="exec-light"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="h-9 px-3 text-[12.5px] cursor-pointer w-fit"
                >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    {uploading
                        ? "Uploading…"
                        : logoUrl
                          ? "Change logo"
                          : "Upload logo"}
                </Button>
                <span className="text-[11px] text-muted-foreground">
                    PNG, JPG, or WEBP up to 2 MB.
                </span>
            </div>
            <input
                ref={fileRef}
                type="file"
                accept={LOGO_ACCEPT}
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                }}
                className="hidden"
            />
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
