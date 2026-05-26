"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    BookOpen,
    Calendar,
    GraduationCap,
    Globe,
    Info,
    MapPin,
    Phone,
    User,
    Users,
} from "lucide-react";
import { PiLinkedinLogoFill } from "react-icons/pi";
import { studentApi, type Gender, type StudentProfile } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

type FormState = {
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    dob: string;
    gender: Gender | "";
    bio: string;
    linkedinUrl: string;
    portfolioUrl: string;
    college: string;
    branch: string;
};

const empty: FormState = {
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    dob: "",
    gender: "",
    bio: "",
    linkedinUrl: "",
    portfolioUrl: "",
    college: "",
    branch: "",
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
        linkedinUrl: p.linkedinUrl ?? "",
        portfolioUrl: p.portfolioUrl ?? "",
        college: p.college ?? "",
        branch: p.branch ?? "",
    };
}

function isHttpUrl(value: string): boolean {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

export function BasicsForm({
    profile,
    onSaved,
    onCancel,
}: {
    profile: StudentProfile | null;
    onSaved: () => Promise<void>;
    onCancel?: () => void;
}) {
    const [form, setForm] = useState<FormState>(() => fromProfile(profile));
    const [errors, setErrors] = useState<
        Partial<Record<keyof FormState, string>>
    >({});
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
            toast.error("Please add your first name.");
            return;
        }
        const linkedin = form.linkedinUrl.trim();
        if (linkedin && !isHttpUrl(linkedin)) {
            toast.error(
                "LinkedIn URL doesn’t look right. Include https:// at the start.",
            );
            return;
        }
        const portfolio = form.portfolioUrl.trim();
        if (portfolio && !isHttpUrl(portfolio)) {
            toast.error(
                "Portfolio URL doesn’t look right. Include https:// at the start.",
            );
            return;
        }
        setSaving(true);
        const payload = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim() || undefined,
            phone: form.phone.trim() || undefined,
            city: form.city.trim() || undefined,
            dob: form.dob ? new Date(form.dob).toISOString() : undefined,
            gender: form.gender || undefined,
            bio: form.bio.trim() || undefined,
            linkedinUrl: linkedin || undefined,
            portfolioUrl: portfolio || undefined,
            college: form.college.trim() || undefined,
            branch: form.branch.trim() || undefined,
        };
        try {
            if (profile) await studentApi.update(payload);
            else await studentApi.create(payload);
            await onSaved();
            onCancel?.();
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
                <Field label="Phone" icon={<Phone className="h-3.5 w-3.5" />}>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                        autoComplete="tel"
                        className={inputCls()}
                    />
                </Field>
                <Field label="City" icon={<MapPin className="h-3.5 w-3.5" />}>
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
                <Field label="Gender" icon={<Users className="h-3.5 w-3.5" />}>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                    label="College"
                    icon={<GraduationCap className="h-3.5 w-3.5" />}
                    hint="Used by founders to filter applicants."
                >
                    <input
                        type="text"
                        value={form.college}
                        onChange={(e) => set("college", e.target.value)}
                        placeholder="IIT Bombay"
                        className={inputCls()}
                    />
                </Field>
                <Field
                    label="Branch"
                    icon={<BookOpen className="h-3.5 w-3.5" />}
                >
                    <input
                        type="text"
                        value={form.branch}
                        onChange={(e) => set("branch", e.target.value)}
                        placeholder="Computer Science"
                        className={inputCls()}
                    />
                </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                    label="LinkedIn URL"
                    icon={<PiLinkedinLogoFill className="h-3.5 w-3.5" />}
                    hint="Shown on your public profile."
                >
                    <input
                        type="url"
                        value={form.linkedinUrl}
                        onChange={(e) => set("linkedinUrl", e.target.value)}
                        placeholder="https://linkedin.com/in/your-handle"
                        className={inputCls()}
                    />
                </Field>
                <Field
                    label="Portfolio link"
                    icon={<Globe className="h-3.5 w-3.5" />}
                    hint="Personal site, GitHub, Behance — whatever shows your work."
                >
                    <input
                        type="url"
                        value={form.portfolioUrl}
                        onChange={(e) => set("portfolioUrl", e.target.value)}
                        placeholder="https://yourname.dev"
                        className={inputCls()}
                    />
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

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                {onCancel && (
                    <Button
                        type="button"
                        variant="exec-light"
                        onClick={onCancel}
                        disabled={saving}
                        className="h-9 px-3 text-[12.5px] cursor-pointer"
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-9 px-3 text-[12.5px] cursor-pointer"
                >
                    {saving
                        ? "Saving…"
                        : profile
                          ? "Save changes"
                          : "Create profile"}
                </Button>
            </div>
        </div>
    );
}
