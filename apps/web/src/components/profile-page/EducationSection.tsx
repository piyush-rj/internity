"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
    EntityCard,
    Field,
    InlineFormCard,
    ProfileMissingNotice,
    inputCls,
} from "@/src/components/profile-wizard/utils";
import { SectionCard } from "@/src/components/profile-page/SectionCard";
import { studentApi, type StudentProfile } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { EducationInput } from "@/src/lib/api/student";

const empty: EducationInput = {
    institute: "",
    degree: "",
    fieldOfStudy: "",
    startYear: new Date().getFullYear(),
    endYear: undefined,
    grade: "",
    current: false,
};

export function EducationSection({
    profile,
    onSaved,
}: {
    profile: StudentProfile | null;
    onSaved: () => Promise<void>;
}) {
    const items = profile?.educations ?? [];
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<EducationInput>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set<K extends keyof EducationInput>(
        key: K,
        value: EducationInput[K],
    ) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function handleAdd() {
        if (!form.institute.trim() || !form.degree.trim() || !form.startYear) {
            setError("Institute, degree and start year are required.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await studentApi.add_education({
                ...form,
                institute: form.institute.trim(),
                degree: form.degree.trim(),
                fieldOfStudy: form.fieldOfStudy?.trim() || undefined,
                grade: form.grade?.trim() || undefined,
                endYear: form.current ? undefined : form.endYear || undefined,
            });
            setForm(empty);
            setOpen(false);
            await onSaved();
        } catch (err) {
            setError(
                err instanceof ApiClientError ? err.message : "Couldn’t save.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleRemove(id: string) {
        try {
            await studentApi.remove_education(id);
            await onSaved();
        } catch {}
    }

    return (
        <SectionCard
            id="profile-education"
            title="Education"
            action={
                profile && !open ? (
                    <AddButton onClick={() => setOpen(true)} />
                ) : null
            }
        >
            {!profile ? (
                <ProfileMissingNotice />
            ) : (
                <div className="space-y-3">
                    {items.map((it) => (
                        <EntityCard
                            key={it.id}
                            title={`${it.degree}${it.fieldOfStudy ? ` · ${it.fieldOfStudy}` : ""}`}
                            subtitle={it.institute}
                            meta={`${it.startYear} – ${it.current ? "Present" : (it.endYear ?? "—")}${it.grade ? ` · ${it.grade}` : ""}`}
                            onDelete={() => handleRemove(it.id)}
                        />
                    ))}

                    {items.length === 0 && !open && (
                        <EmptyHint label="No education added yet." />
                    )}

                    {open && (
                        <InlineFormCard
                            onCancel={() => {
                                setOpen(false);
                                setForm(empty);
                                setError(null);
                            }}
                            onSave={handleAdd}
                            saving={saving}
                            error={error}
                            saveLabel="Add education"
                        >
                            <Field label="Institute" required>
                                <input
                                    type="text"
                                    value={form.institute}
                                    onChange={(e) =>
                                        set("institute", e.target.value)
                                    }
                                    placeholder="IIT Delhi"
                                    className={inputCls()}
                                />
                            </Field>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Degree" required>
                                    <input
                                        type="text"
                                        value={form.degree}
                                        onChange={(e) =>
                                            set("degree", e.target.value)
                                        }
                                        placeholder="B.Tech"
                                        className={inputCls()}
                                    />
                                </Field>
                                <Field label="Field of study">
                                    <input
                                        type="text"
                                        value={form.fieldOfStudy ?? ""}
                                        onChange={(e) =>
                                            set("fieldOfStudy", e.target.value)
                                        }
                                        placeholder="Computer Science"
                                        className={inputCls()}
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Field label="Start year" required>
                                    <input
                                        type="number"
                                        min={1950}
                                        max={2099}
                                        value={form.startYear}
                                        onChange={(e) =>
                                            set(
                                                "startYear",
                                                Number(e.target.value),
                                            )
                                        }
                                        className={inputCls()}
                                    />
                                </Field>
                                <Field label="End year">
                                    <input
                                        type="number"
                                        min={1950}
                                        max={2099}
                                        value={form.endYear ?? ""}
                                        onChange={(e) =>
                                            set(
                                                "endYear",
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : undefined,
                                            )
                                        }
                                        disabled={form.current}
                                        className={inputCls()}
                                    />
                                </Field>
                                <Field label="Grade / CGPA">
                                    <input
                                        type="text"
                                        value={form.grade ?? ""}
                                        onChange={(e) =>
                                            set("grade", e.target.value)
                                        }
                                        placeholder="8.9 CGPA"
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
                                I’m still studying here
                            </label>
                        </InlineFormCard>
                    )}
                </div>
            )}
        </SectionCard>
    );
}

export function AddButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand hover:underline"
        >
            <Plus className="h-3.5 w-3.5" />
            Add
        </button>
    );
}

export function EmptyHint({ label }: { label: string }) {
    return (
        <p className="text-[13px] text-muted-foreground py-4 text-center">
            {label}
        </p>
    );
}
