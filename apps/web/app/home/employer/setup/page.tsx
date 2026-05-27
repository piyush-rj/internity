"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import { employerApi, type EmployerProfileInput } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { useMeStore } from "@/src/store/useMeStore";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/src/lib/catalog/countries";
import { cn } from "@/src/lib/utils";

// Single-form employer onboarding: personal details + country + LinkedIn.
// "What best describes your organization?" lives on the create-company
// form (where it actually applies) — keeping it off this form means a
// founder who is only joining an existing company never has to answer it.
export default function EmployerSetupPage() {
    const router = useRouter();
    const { profile, memberships, loading, refetch } = useMyEmployer();
    const refetchMe = useMeStore((s) => s.refetch);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        jobTitle: "",
        linkedinUrl: "",
        country: DEFAULT_COUNTRY,
    });
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm((f) => ({
            ...f,
            firstName: profile.firstName ?? "",
            lastName: profile.lastName ?? "",
            phone: profile.phone ?? "",
            jobTitle: profile.jobTitle ?? "",
            linkedinUrl: profile.linkedinUrl ?? "",
            country: profile.country ?? DEFAULT_COUNTRY,
        }));
    }, [profile]);

    function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    function isHttpUrl(v: string): boolean {
        try {
            const u = new URL(v);
            return u.protocol === "http:" || u.protocol === "https:";
        } catch {
            return false;
        }
    }

    async function submit() {
        if (!form.firstName.trim())
            return toast.error("First name is required.");
        if (!form.phone.trim()) return toast.error("Phone is required.");
        if (!form.jobTitle.trim())
            return toast.error("Your role at the company is required.");
        if (!form.country.trim())
            return toast.error("Pick your country.");
        const linkedin = form.linkedinUrl.trim();
        if (!linkedin) {
            return toast.error(
                "LinkedIn profile is required — it helps founders trust you.",
            );
        }
        if (!isHttpUrl(linkedin)) {
            return toast.error(
                "LinkedIn URL doesn't look right. Include https:// at the start.",
            );
        }
        setSaving(true);
        try {
            const input: EmployerProfileInput = {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim() || undefined,
                phone: form.phone.trim(),
                jobTitle: form.jobTitle.trim(),
                linkedinUrl: linkedin,
                country: form.country.trim(),
            };
            await employerApi.create(input);
            await Promise.all([refetch(), refetchMe()]);
            router.replace("/home/employer/onboard");
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't save. Try again.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-3.25rem)] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-2xl">
                <header className="text-center mb-6">
                    <h1 className="text-[26px] font-semibold tracking-tight">
                        Set up your employer account
                    </h1>
                    <p className="mt-1.5 text-[13px] text-muted-foreground">
                        Tell us about you. You can connect or create a company
                        next.
                    </p>
                </header>
                <div className="rounded-lg border border-border bg-card p-6 sm:p-8 space-y-4">
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
                                onChange={(e) => set("phone", e.target.value)}
                                placeholder="+91 98765 43210"
                                autoComplete="tel"
                                className={inputCls()}
                            />
                        </Field>
                        <Field label="Your role at the company" required>
                            <input
                                type="text"
                                value={form.jobTitle}
                                onChange={(e) =>
                                    set("jobTitle", e.target.value)
                                }
                                placeholder="Talent Lead, Founder, HR…"
                                className={inputCls()}
                            />
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
                            hint="Founders use this to verify you before sharing applicants."
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
            </div>
        </div>
    );
}
