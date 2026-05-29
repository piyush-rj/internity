"use client";

import { useEffect, useState } from "react";
import {
    Calendar,
    Check,
    Info,
    MapPin,
    Phone,
    Target,
    User,
    Users,
} from "lucide-react";
import {
    Field,
    inputCls,
    StepShell,
} from "@/src/components/profile-wizard/utils";
import {
    studentApi,
    type Gender,
    type JobTitle,
    type StudentProfile,
} from "@/src/lib/api";
import { JOB_TITLES } from "@/src/lib/catalog/jobTitles";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

type FormState = {
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    dob: string;
    gender: Gender | "";
    bio: string;
    interestedJobTitles: JobTitle[];
};

const empty: FormState = {
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    dob: "",
    gender: "",
    bio: "",
    interestedJobTitles: [],
};

function fromProfile(p: StudentProfile | null): FormState {
    if (!p) return empty;
    return {
        firstName: p.firstName ?? "",
        lastName: p.lastName ?? "",
        phone: p.phone ?? "",
        city: p.city ?? "",
        dob: p.dob ? p.dob.slice(0, 10) : "",
        gender: p.gender ?? "",
        bio: p.bio ?? "",
        interestedJobTitles: p.interestedJobTitles ?? [],
    };
}

export function BasicsStep({
    profile,
    onSaved,
    onContinue,
}: {
    profile: StudentProfile | null;
    onSaved: () => Promise<void>;
    onContinue: () => void;
}) {
    const [form, setForm] = useState<FormState>(() => fromProfile(profile));
    const [errors, setErrors] = useState<
        Partial<Record<keyof FormState, string>>
    >({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm(fromProfile(profile));
    }, [profile]);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((f) => ({ ...f, [key]: value }));
        if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    }

    async function handleSave() {
        if (!form.firstName.trim()) {
            setErrors({ firstName: "First name is required." });
            return;
        }
        setSaving(true);
        setSubmitError(null);
        const payload = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim() || undefined,
            phone: form.phone.trim() || undefined,
            city: form.city.trim() || undefined,
            dob: form.dob ? new Date(form.dob).toISOString() : undefined,
            gender: form.gender || undefined,
            bio: form.bio.trim() || undefined,
            interestedJobTitles:
                form.interestedJobTitles.length > 0
                    ? form.interestedJobTitles
                    : [],
        };
        try {
            if (profile) {
                await studentApi.update(payload);
            } else {
                await studentApi.create(payload);
            }
            await onSaved();
            onContinue();
        } catch (err) {
            setSubmitError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t save your profile. Please try again.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <StepShell
            stepKey="basics"
            title="Tell us a bit about yourself"
            description="Only your first name is required — you can fill the rest now or later."
            onContinue={handleSave}
            saving={saving}
            continueLabel={profile ? "Save & continue" : "Save & continue"}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                        label="First name"
                        required
                        error={errors.firstName}
                        icon={<User className="h-3.5 w-3.5" />}
                    >
                        <input
                            type="text"
                            value={form.firstName}
                            onChange={(e) => set("firstName", e.target.value)}
                            placeholder="Piyush"
                            autoComplete="given-name"
                            className={inputCls(!!errors.firstName)}
                        />
                    </Field>
                    <Field
                        label="Last name"
                        icon={<User className="h-3.5 w-3.5" />}
                    >
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
                        label="Phone"
                        icon={<Phone className="h-3.5 w-3.5" />}
                    >
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => set("phone", e.target.value)}
                            placeholder="+91 98765 43210"
                            autoComplete="tel"
                            className={inputCls()}
                        />
                    </Field>
                    <Field
                        label="City"
                        icon={<MapPin className="h-3.5 w-3.5" />}
                    >
                        <input
                            type="text"
                            value={form.city}
                            onChange={(e) => set("city", e.target.value)}
                            placeholder="Bengaluru"
                            autoComplete="address-level2"
                            className={inputCls()}
                        />
                    </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                        label="Date of birth"
                        icon={<Calendar className="h-3.5 w-3.5" />}
                    >
                        <input
                            type="date"
                            value={form.dob}
                            onChange={(e) => set("dob", e.target.value)}
                            className={inputCls()}
                        />
                    </Field>
                    <Field
                        label="Gender"
                        icon={<Users className="h-3.5 w-3.5" />}
                    >
                        <select
                            value={form.gender}
                            onChange={(e) =>
                                set("gender", e.target.value as Gender | "")
                            }
                            className={cn(inputCls(), "pr-8 appearance-none")}
                        >
                            <option value="">Prefer not to say</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                            <option value="PREFER_NOT_TO_SAY">
                                Prefer not to say
                            </option>
                        </select>
                    </Field>
                </div>

                <Field
                    label="Interested roles"
                    icon={<Target className="h-3.5 w-3.5" />}
                    hint="Pick the roles you want. We'll rank matching listings first on your feed."
                >
                    <div className="flex flex-wrap gap-1.5">
                        {JOB_TITLES.map((o) => {
                            const selected = form.interestedJobTitles.includes(
                                o.value,
                            );
                            return (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => {
                                        setForm((f) => {
                                            const next = new Set(
                                                f.interestedJobTitles,
                                            );
                                            if (next.has(o.value))
                                                next.delete(o.value);
                                            else next.add(o.value);
                                            return {
                                                ...f,
                                                interestedJobTitles:
                                                    Array.from(next),
                                            };
                                        });
                                    }}
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] cursor-pointer transition-colors",
                                        selected
                                            ? "border-orange-500 bg-orange-50 text-orange-700"
                                            : "border-border bg-background text-foreground hover:bg-secondary",
                                    )}
                                >
                                    {selected && <Check className="h-3 w-3" />}
                                    {o.label}
                                </button>
                            );
                        })}
                    </div>
                </Field>

                <Field
                    label="Short bio"
                    hint="Optional — one line is plenty. You can edit it anytime."
                    icon={<Info className="h-3.5 w-3.5" />}
                >
                    <textarea
                        value={form.bio}
                        onChange={(e) => set("bio", e.target.value)}
                        placeholder="CS undergrad at IIT Delhi, building things on weekends."
                        rows={2}
                        maxLength={240}
                        className={cn(inputCls(), "min-h-16 resize-y py-2")}
                    />
                    <div className="mt-1 text-right text-[11px] text-muted-foreground tabular-nums">
                        {form.bio.length}/240
                    </div>
                </Field>

                {submitError && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{submitError}</span>
                    </div>
                )}
            </div>
        </StepShell>
    );
}
