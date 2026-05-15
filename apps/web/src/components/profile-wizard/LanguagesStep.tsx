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
    type LanguageInput,
    type StudentProfile,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

const proficiencyLabels = ["Basic", "Conversational", "Fluent", "Native"];

const empty: LanguageInput = {
    name: "",
    proficiency: 2,
};

export function LanguagesStep({
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
    const items = profile?.languages ?? [];
    const [open, setOpen] = useState(items.length === 0);
    const [form, setForm] = useState<LanguageInput>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set<K extends keyof LanguageInput>(
        key: K,
        value: LanguageInput[K],
    ) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function handleAdd() {
        if (!form.name.trim()) {
            setError("Language is required.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await studentApi.add_language({
                name: form.name.trim(),
                proficiency: form.proficiency,
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
            await studentApi.remove_language(id);
            await onSaved();
        } catch {
            /* ignore */
        }
    }

    return (
        <StepShell
            stepKey="languages"
            title="Languages you speak"
            description="A small detail that often matters more than you'd think."
            onBack={onBack}
            onContinue={onContinue}
            continueLabel="Finish"
        >
            <div className="space-y-3">
                {!profile && <ProfileMissingNotice />}

                {items.map((it) => (
                    <EntityCard
                        key={it.id}
                        title={it.name}
                        subtitle={
                            proficiencyLabels[
                                Math.min(
                                    Math.max((it.proficiency ?? 2) - 1, 0),
                                    3,
                                )
                            ]
                        }
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
                        saveLabel="Add language"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                            <Field label="Language" required>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) =>
                                        set("name", e.target.value)
                                    }
                                    placeholder="English"
                                    className={inputCls()}
                                />
                            </Field>
                            <Field label="Proficiency">
                                <div className="flex items-center gap-1">
                                    {proficiencyLabels.map((label, idx) => {
                                        const value = idx + 1;
                                        const active =
                                            form.proficiency === value;
                                        return (
                                            <button
                                                key={label}
                                                type="button"
                                                onClick={() =>
                                                    set("proficiency", value)
                                                }
                                                className={cn(
                                                    "h-10 px-3 rounded-md border text-[12.5px] transition-colors",
                                                    active
                                                        ? "bg-secondary border-foreground/20 text-foreground font-medium"
                                                        : "bg-background border-border text-muted-foreground hover:text-foreground",
                                                )}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Field>
                        </div>
                    </InlineFormCard>
                ) : (
                    profile && (
                        <AddButton
                            label={
                                items.length ? "Add another" : "Add language"
                            }
                            onClick={() => setOpen(true)}
                        />
                    )
                )}
            </div>
        </StepShell>
    );
}
