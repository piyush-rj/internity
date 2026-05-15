"use client";

import { useState } from "react";
import {
    AddButton,
    EntityCard,
    Field,
    InlineFormCard,
    ProfileMissingNotice,
    StepShell,
    inputCls,
} from "@/src/components/profile-wizard/utils";
import {
    studentApi,
    type ExperienceInput,
    type StudentProfile,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

const empty: ExperienceInput = {
    company: "",
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
};

export function ExperienceStep({
    profile,
    onSaved,
    onBack,
    onContinue,
}: {
    profile: StudentProfile | null;
    onSaved: () => Promise<void>;
    onBack: () => void;
    onContinue: () => void;
}) {
    const items = profile?.experiences ?? [];
    const [open, setOpen] = useState(items.length === 0);
    const [form, setForm] = useState<ExperienceInput>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set<K extends keyof ExperienceInput>(
        key: K,
        value: ExperienceInput[K],
    ) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function handleAdd() {
        if (!form.company.trim() || !form.title.trim() || !form.startDate) {
            setError("Company, title and start date are required.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await studentApi.add_experience({
                company: form.company.trim(),
                title: form.title.trim(),
                location: form.location?.trim() || undefined,
                startDate: new Date(form.startDate).toISOString(),
                endDate:
                    form.current || !form.endDate
                        ? undefined
                        : new Date(form.endDate).toISOString(),
                current: !!form.current,
                description: form.description?.trim() || undefined,
            });
            setForm(empty);
            setOpen(false);
            await onSaved();
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t save. Please try again.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleRemove(id: string) {
        try {
            await studentApi.remove_experience(id);
            await onSaved();
        } catch {
            /* ignore */
        }
    }

    return (
        <StepShell
            stepKey="experience"
            title="Your work experience"
            description="Internships, part-time gigs, side projects you got paid for — anything counts."
            onBack={onBack}
            onContinue={onContinue}
        >
            <div className="space-y-3">
                {!profile && <ProfileMissingNotice />}

                {items.map((it) => (
                    <EntityCard
                        key={it.id}
                        title={it.title}
                        subtitle={`${it.company}${it.location ? ` · ${it.location}` : ""}`}
                        meta={`${fmtDate(it.startDate)} – ${it.current ? "Present" : fmtDate(it.endDate)}`}
                        onDelete={() => handleRemove(it.id)}
                    />
                ))}

                {open ? (
                    <InlineFormCard
                        onCancel={() => {
                            setOpen(false);
                            setForm(empty);
                            setError(null);
                        }}
                        onSave={handleAdd}
                        saving={saving}
                        error={error}
                        saveLabel="Add experience"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Company" required>
                                <input
                                    type="text"
                                    value={form.company}
                                    onChange={(e) =>
                                        set("company", e.target.value)
                                    }
                                    placeholder="Razorpay"
                                    className={inputCls()}
                                />
                            </Field>
                            <Field label="Title" required>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) =>
                                        set("title", e.target.value)
                                    }
                                    placeholder="Frontend Intern"
                                    className={inputCls()}
                                />
                            </Field>
                        </div>
                        <Field label="Location">
                            <input
                                type="text"
                                value={form.location ?? ""}
                                onChange={(e) =>
                                    set("location", e.target.value)
                                }
                                placeholder="Bengaluru · Remote"
                                className={inputCls()}
                            />
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Start date" required>
                                <input
                                    type="date"
                                    value={form.startDate?.slice(0, 10) ?? ""}
                                    onChange={(e) =>
                                        set("startDate", e.target.value)
                                    }
                                    className={inputCls()}
                                />
                            </Field>
                            <Field label="End date">
                                <input
                                    type="date"
                                    value={form.endDate?.slice(0, 10) ?? ""}
                                    onChange={(e) =>
                                        set("endDate", e.target.value)
                                    }
                                    disabled={form.current}
                                    className={inputCls()}
                                />
                            </Field>
                        </div>
                        <label className="flex items-center gap-2 text-[12.5px] text-foreground select-none">
                            <input
                                type="checkbox"
                                checked={!!form.current}
                                onChange={(e) =>
                                    set("current", e.target.checked)
                                }
                                className="h-3.5 w-3.5 rounded border-border accent-brand"
                            />
                            I currently work here
                        </label>
                        <Field
                            label="What did you do?"
                            hint="Optional — a few sentences works."
                        >
                            <textarea
                                value={form.description ?? ""}
                                onChange={(e) =>
                                    set("description", e.target.value)
                                }
                                rows={3}
                                placeholder="Built the new checkout UI in React + TypeScript…"
                                className={`${inputCls()} min-h-24 resize-y py-2`}
                            />
                        </Field>
                    </InlineFormCard>
                ) : (
                    profile && (
                        <AddButton
                            label={
                                items.length ? "Add another" : "Add experience"
                            }
                            onClick={() => setOpen(true)}
                        />
                    )
                )}
            </div>
        </StepShell>
    );
}

function fmtDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}
