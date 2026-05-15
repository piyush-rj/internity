"use client";

import { useEffect, useState } from "react";
import { Calendar, Info, MapPin, Phone, User, Users } from "lucide-react";
import {
    Field,
    inputCls,
    StepShell,
} from "@/src/components/profile-wizard/utils";
import { studentApi, type Gender, type StudentProfile } from "@/src/lib/api";
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
};

const empty: FormState = {
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    dob: "",
    gender: "",
    bio: "",
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
                    label="Short bio"
                    hint="A line or two recruiters see at the top of your profile."
                    icon={<Info className="h-3.5 w-3.5" />}
                >
                    <textarea
                        value={form.bio}
                        onChange={(e) => set("bio", e.target.value)}
                        placeholder="CS undergrad at IIT Delhi, building things on weekends."
                        rows={3}
                        maxLength={240}
                        className={cn(inputCls(), "min-h-24 resize-y py-2")}
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
