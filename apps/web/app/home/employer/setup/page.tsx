"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Mail, SkipForward } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import {
    companyApi,
    employerApi,
    invitationApi,
    type CompanyInput,
    type EmployerProfileInput,
    type OrganizationType,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { useMeStore } from "@/src/store/useMeStore";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/src/lib/catalog/countries";
import { INDUSTRIES } from "@/src/lib/catalog/industries";
import { ORG_TYPES } from "@/src/lib/catalog/orgTypes";
import { cn } from "@/src/lib/utils";

// Common roles surfaced to founders signing up. Order is intentional:
// the small-startup roles people most often pick come first.
const ROLE_OPTIONS = [
    "Founder",
    "Co-founder",
    "CEO",
    "CTO",
    "COO",
    "HR Manager",
    "Talent Acquisition",
    "Recruiter",
    "Hiring Manager",
    "Engineering Manager",
    "Product Manager",
    "Operations Lead",
    "Marketing Lead",
    "People Operations",
] as const;
const OTHER_ROLE = "Other";

const TEAM_SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "500+"];

type CompanyChoice = "" | "create" | "join";

// Single-form employer onboarding: personal details, then an inline
// "Connect a company" section that extends the form with either create-
// company fields or an invite-token input. Submission saves the employer
// profile and (optionally) the company step in one go.
export default function EmployerSetupPage() {
    const router = useRouter();
    const { profile, memberships, loading, refetch } = useMyEmployer();
    const refetchMe = useMeStore((s) => s.refetch);
    const currentYear = useMemo(() => new Date().getUTCFullYear(), []);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        jobTitle: "",
        linkedinUrl: "",
        country: DEFAULT_COUNTRY,
    });
    // Tracks which dropdown row is selected. Empty = no choice yet,
    // OTHER_ROLE = "Other" picked → free-text input revealed.
    const [roleChoice, setRoleChoice] = useState<string>("");

    const [companyChoice, setCompanyChoice] = useState<CompanyChoice>("");
    const [company, setCompany] = useState({
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
    const [inviteToken, setInviteToken] = useState("");

    const [saving, setSaving] = useState(false);

    // If they already have a company membership, jump straight to dashboard.
    useEffect(() => {
        if (loading) return;
        if (profile && memberships.length > 0) {
            const m = memberships[0]!;
            if (m.company.verificationStatus !== "REJECTED") {
                router.replace("/home/dashboard");
            }
        }
    }, [loading, profile, memberships, router]);

    // Prefill from existing profile (edit case)
    useEffect(() => {
        if (!profile) return;
        const existingTitle = profile.jobTitle ?? "";
        const matched = (ROLE_OPTIONS as readonly string[]).includes(
            existingTitle,
        );
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm((f) => ({
            ...f,
            firstName: profile.firstName ?? "",
            lastName: profile.lastName ?? "",
            phone: profile.phone ?? "",
            jobTitle: existingTitle,
            linkedinUrl: profile.linkedinUrl ?? "",
            country: profile.country ?? DEFAULT_COUNTRY,
        }));
        setRoleChoice(
            existingTitle ? (matched ? existingTitle : OTHER_ROLE) : "",
        );
    }, [profile]);

    function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm((f) => ({ ...f, [k]: v }));
    }
    function setC<K extends keyof typeof company>(
        k: K,
        v: (typeof company)[K],
    ) {
        setCompany((c) => ({ ...c, [k]: v }));
    }

    function onCompanyNameChange(value: string) {
        setC("name", value);
        if (!slugDirty) setC("slug", slugify(value));
    }

    function isHttpUrl(v: string): boolean {
        try {
            const u = new URL(v);
            return u.protocol === "http:" || u.protocol === "https:";
        } catch {
            return false;
        }
    }

    function validatePersonal(): string | null {
        if (!form.firstName.trim()) return "First name is required.";
        if (!form.phone.trim()) return "Phone is required.";
        if (!form.jobTitle.trim())
            return "Your role at the company is required.";
        if (!form.country.trim()) return "Pick your country.";
        const linkedin = form.linkedinUrl.trim();
        if (!linkedin)
            return "LinkedIn profile is required — it helps founders trust you.";
        if (!isHttpUrl(linkedin))
            return "LinkedIn URL doesn't look right. Include https:// at the start.";
        return null;
    }

    function validateCompany(): string | null {
        if (!company.name.trim()) return "Please add your company name.";
        if (!company.slug.trim()) return "Please add a public URL slug.";
        if (!/^[a-z0-9-]+$/.test(company.slug.trim())) {
            return "URL slug can only have lowercase letters, numbers, and hyphens.";
        }
        if (
            company.linkedinUrl.trim() &&
            !isHttpUrl(company.linkedinUrl.trim())
        ) {
            return "Company LinkedIn URL doesn't look right. Include https:// at the start.";
        }
        if (company.website.trim() && !isHttpUrl(company.website.trim())) {
            return "Website URL doesn't look right. Include https:// at the start.";
        }
        const year = Number(company.foundingYear);
        if (!company.foundingYear.trim() || !Number.isInteger(year)) {
            return "Please add your founding year.";
        }
        if (year < 1800 || year > currentYear) {
            return `Founding year must be between 1800 and ${currentYear}.`;
        }
        if (!company.size.trim()) return "Please pick your team size.";
        if (!company.country.trim())
            return "Please pick the company's country.";
        if (!company.organizationType)
            return "Pick what best describes your organization.";
        if (!company.about.trim())
            return "Add a short blurb about what your company does.";
        return null;
    }

    async function submit() {
        const personalErr = validatePersonal();
        if (personalErr) {
            toast.error(personalErr);
            return;
        }
        if (companyChoice === "create") {
            const companyErr = validateCompany();
            if (companyErr) {
                toast.error(companyErr);
                return;
            }
        }
        if (companyChoice === "join" && !inviteToken.trim()) {
            toast.error("Paste the invite link or token.");
            return;
        }

        setSaving(true);
        try {
            const employerInput: EmployerProfileInput = {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim() || undefined,
                phone: form.phone.trim(),
                jobTitle: form.jobTitle.trim(),
                linkedinUrl: form.linkedinUrl.trim(),
                country: form.country.trim(),
            };
            await employerApi.create(employerInput);

            if (companyChoice === "create") {
                const companyInput: CompanyInput = {
                    name: company.name.trim(),
                    slug: company.slug.trim(),
                    website: company.website.trim() || undefined,
                    linkedinUrl: company.linkedinUrl.trim() || undefined,
                    foundingYear: Number(company.foundingYear),
                    about: company.about.trim(),
                    industry: company.industry.trim() || undefined,
                    size: company.size.trim(),
                    city: company.city.trim() || undefined,
                    country: company.country.trim(),
                    organizationType:
                        company.organizationType as OrganizationType,
                };
                await companyApi.create(companyInput);
                await Promise.all([refetch(), refetchMe()]);
                toast.success("Company created. You can post listings now.");
                router.replace("/home/dashboard");
                return;
            }

            if (companyChoice === "join") {
                const raw = inviteToken.trim();
                // Accept either the bare token or a full URL like /invite/<token>
                const t = raw.includes("/invite/")
                    ? raw.split("/invite/")[1]!.split(/[?#]/)[0]!
                    : raw;
                await invitationApi.accept(t);
                await Promise.all([refetch(), refetchMe()]);
                toast.success("Joined the company.");
                router.replace("/home/dashboard");
                return;
            }

            // No company step — just personal details saved.
            await Promise.all([refetch(), refetchMe()]);
            router.replace("/home/dashboard");
        } catch (err) {
            toast.error(humanizeError(err));
        } finally {
            setSaving(false);
        }
    }

    const submitLabel = saving
        ? companyChoice === "create"
            ? "Creating…"
            : companyChoice === "join"
              ? "Joining…"
              : "Saving…"
        : companyChoice === "create"
          ? "Create company"
          : companyChoice === "join"
            ? "Join company"
            : "Continue";

    return (
        <div className="min-h-[calc(100vh-3.25rem)] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-2xl">
                <header className="text-center mb-6">
                    <h1 className="text-[26px] font-semibold tracking-tight">
                        Set up your employer account
                    </h1>
                    <p className="mt-1.5 text-[13px] text-muted-foreground">
                        Tell us about you and connect a company in one step.
                    </p>
                </header>
                <div className="rounded-lg border border-border bg-card p-6 sm:p-8 space-y-6">
                    {/* personal details */}
                    <section className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="First name" required>
                                <input
                                    type="text"
                                    value={form.firstName}
                                    onChange={(e) =>
                                        set("firstName", e.target.value)
                                    }
                                    placeholder="Priya"
                                    autoComplete="given-name"
                                    className={inputCls()}
                                />
                            </Field>
                            <Field label="Last name">
                                <input
                                    type="text"
                                    value={form.lastName}
                                    onChange={(e) =>
                                        set("lastName", e.target.value)
                                    }
                                    placeholder="Sharma"
                                    autoComplete="family-name"
                                    className={inputCls()}
                                />
                            </Field>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Phone" required>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) =>
                                        set("phone", e.target.value)
                                    }
                                    placeholder="+91 98765 43210"
                                    autoComplete="tel"
                                    className={inputCls()}
                                />
                            </Field>
                            <Field label="Your role at the company" required>
                                <div className="space-y-2">
                                    <select
                                        value={roleChoice}
                                        onChange={(e) => {
                                            const next = e.target.value;
                                            setRoleChoice(next);
                                            if (next === OTHER_ROLE) {
                                                set("jobTitle", "");
                                            } else {
                                                set("jobTitle", next);
                                            }
                                        }}
                                        className={cn(
                                            inputCls(),
                                            "appearance-none pr-8 cursor-pointer",
                                        )}
                                    >
                                        <option value="" disabled>
                                            Select your role…
                                        </option>
                                        {ROLE_OPTIONS.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                        <option value={OTHER_ROLE}>
                                            Other (type your role)
                                        </option>
                                    </select>
                                    {roleChoice === OTHER_ROLE && (
                                        <input
                                            type="text"
                                            value={form.jobTitle}
                                            onChange={(e) =>
                                                set("jobTitle", e.target.value)
                                            }
                                            placeholder="e.g. Head of Growth"
                                            className={inputCls()}
                                            autoFocus
                                        />
                                    )}
                                </div>
                            </Field>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Country" required>
                                <select
                                    value={form.country}
                                    onChange={(e) =>
                                        set("country", e.target.value)
                                    }
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
                            <Field
                                label="LinkedIn"
                                required
                                hint="Founders use this to verify you."
                            >
                                <input
                                    type="url"
                                    value={form.linkedinUrl}
                                    onChange={(e) =>
                                        set("linkedinUrl", e.target.value)
                                    }
                                    placeholder="https://linkedin.com/in/your-handle"
                                    className={inputCls()}
                                />
                            </Field>
                        </div>
                    </section>

                    {/* connect a company */}
                    <section className="space-y-3 pt-2 border-t border-border">
                        <div>
                            <h2 className="text-[15px] font-semibold tracking-tight">
                                Connect a company
                            </h2>
                            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                                Create a new company or join an existing one via
                                invite. You can do this later if you&rsquo;d
                                rather skip for now.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <ChoiceCard
                                icon={<Building2 className="h-5 w-5" />}
                                iconWrap="bg-brand/10 text-brand"
                                title="Create a new company"
                                body="Add your company details so you can post listings and invite teammates."
                                selected={companyChoice === "create"}
                                onClick={() =>
                                    setCompanyChoice((c) =>
                                        c === "create" ? "" : "create",
                                    )
                                }
                            />
                            <ChoiceCard
                                icon={<Mail className="h-5 w-5" />}
                                iconWrap="bg-sky-100 text-sky-700"
                                title="Join via company code"
                                body="Paste an invite link your teammate sent you to join their company."
                                selected={companyChoice === "join"}
                                onClick={() =>
                                    setCompanyChoice((c) =>
                                        c === "join" ? "" : "join",
                                    )
                                }
                            />
                        </div>

                        {companyChoice === "create" && (
                            <div className="rounded-lg border border-border bg-secondary/20 p-4 sm:p-5 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field label="Company name" required>
                                        <input
                                            type="text"
                                            value={company.name}
                                            onChange={(e) =>
                                                onCompanyNameChange(
                                                    e.target.value,
                                                )
                                            }
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
                                            value={company.slug}
                                            onChange={(e) => {
                                                setSlugDirty(true);
                                                setC(
                                                    "slug",
                                                    slugify(e.target.value),
                                                );
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
                                            value={company.linkedinUrl}
                                            onChange={(e) =>
                                                setC(
                                                    "linkedinUrl",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="https://linkedin.com/company/acme"
                                            className={inputCls()}
                                        />
                                    </Field>
                                    <Field label="Company Website">
                                        <input
                                            type="url"
                                            value={company.website}
                                            onChange={(e) =>
                                                setC("website", e.target.value)
                                            }
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
                                            value={company.foundingYear}
                                            onChange={(e) =>
                                                setC(
                                                    "foundingYear",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="2022"
                                            className={inputCls()}
                                        />
                                    </Field>
                                    <Field label="Team size" required>
                                        <select
                                            value={company.size}
                                            onChange={(e) =>
                                                setC("size", e.target.value)
                                            }
                                            className={cn(
                                                inputCls(),
                                                "appearance-none pr-8 cursor-pointer",
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
                                            value={company.city}
                                            onChange={(e) =>
                                                setC("city", e.target.value)
                                            }
                                            placeholder="Bengaluru"
                                            className={inputCls()}
                                        />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field label="Country" required>
                                        <select
                                            value={company.country}
                                            onChange={(e) =>
                                                setC("country", e.target.value)
                                            }
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
                                            value={company.industry}
                                            onChange={(e) =>
                                                setC("industry", e.target.value)
                                            }
                                            className={cn(
                                                inputCls(),
                                                "appearance-none pr-8 cursor-pointer",
                                            )}
                                        >
                                            <option value="">
                                                Pick industry
                                            </option>
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
                                        value={company.organizationType}
                                        onChange={(e) =>
                                            setC(
                                                "organizationType",
                                                e.target.value as
                                                    | OrganizationType
                                                    | "",
                                            )
                                        }
                                        className={cn(
                                            inputCls(),
                                            "appearance-none pr-8 cursor-pointer",
                                        )}
                                    >
                                        <option value="">Pick one</option>
                                        {ORG_TYPES.map((o) => (
                                            <option
                                                key={o.value}
                                                value={o.value}
                                            >
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
                                        value={company.about}
                                        onChange={(e) =>
                                            setC("about", e.target.value)
                                        }
                                        placeholder="What does your company do?"
                                        rows={3}
                                        maxLength={400}
                                        className={cn(
                                            inputCls(),
                                            "min-h-20 py-2 resize-y",
                                        )}
                                    />
                                    <div className="mt-1 text-right text-[11px] text-muted-foreground tabular-nums">
                                        {company.about.length}/400
                                    </div>
                                </Field>
                            </div>
                        )}

                        {companyChoice === "join" && (
                            <div className="rounded-lg border border-border bg-secondary/20 p-4 sm:p-5">
                                <Field
                                    label="Invite link or token"
                                    required
                                    hint="Paste the link your teammate sent you."
                                >
                                    <input
                                        type="text"
                                        value={inviteToken}
                                        onChange={(e) =>
                                            setInviteToken(e.target.value)
                                        }
                                        placeholder="https://… /invite/abc123"
                                        className={inputCls()}
                                    />
                                </Field>
                            </div>
                        )}
                    </section>

                    <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                // Skip for now: clear company choice and submit
                                // just the personal details, then go to dashboard.
                                setCompanyChoice("");
                                void submit();
                            }}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                        >
                            <SkipForward className="h-3.5 w-3.5" />
                            Skip for now &mdash; I&rsquo;ll do this later
                        </button>
                        <Button
                            type="button"
                            variant="exec-dark"
                            onClick={submit}
                            disabled={saving}
                            className="h-10 px-4 text-[13px] cursor-pointer"
                        >
                            {submitLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChoiceCard({
    icon,
    iconWrap,
    title,
    body,
    selected,
    onClick,
}: {
    icon: React.ReactNode;
    iconWrap: string;
    title: string;
    body: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "text-left rounded-lg border bg-card p-5 transition-colors cursor-pointer",
                "hover:bg-secondary/40",
                selected
                    ? "border-foreground/30 ring-2 ring-foreground/15"
                    : "border-border",
            )}
            aria-pressed={selected}
        >
            <div
                className={cn(
                    "h-9 w-9 inline-flex items-center justify-center rounded-md",
                    iconWrap,
                )}
            >
                {icon}
            </div>
            <h3 className="mt-3 text-[14px] font-semibold">{title}</h3>
            <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
                {body}
            </p>
        </button>
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

function humanizeError(err: unknown): string {
    if (err instanceof ApiClientError) {
        if (err.code === "SLUG_TAKEN") {
            return "A company with this URL is already registered. Try a different one.";
        }
        return err.message;
    }
    return "Couldn't save. Try again.";
}
