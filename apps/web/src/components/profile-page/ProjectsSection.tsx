"use client";

import { useState } from "react";
import {
    EntityCard,
    Field,
    InlineFormCard,
    ProfileMissingNotice,
    inputCls,
} from "@/src/components/profile-wizard/utils";
import {
    AddButton,
    EmptyHint,
} from "@/src/components/profile-page/EducationSection";
import { SectionCard } from "@/src/components/profile-page/SectionCard";
import {
    studentApi,
    type ProjectInput,
    type StudentProfile,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

const empty: ProjectInput = {
    title: "",
    link: "",
    description: "",
    startDate: "",
    endDate: "",
};

export function ProjectsSection({
    profile,
    onSaved,
}: {
    profile: StudentProfile | null;
    onSaved: () => Promise<void>;
}) {
    const items = profile?.projects ?? [];
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<ProjectInput>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function handleAdd() {
        if (!form.title.trim()) {
            setError("Project title is required.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await studentApi.add_project({
                title: form.title.trim(),
                link: form.link?.trim() || undefined,
                description: form.description?.trim() || undefined,
                startDate: form.startDate
                    ? new Date(form.startDate).toISOString()
                    : undefined,
                endDate: form.endDate
                    ? new Date(form.endDate).toISOString()
                    : undefined,
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
            await studentApi.remove_project(id);
            await onSaved();
        } catch {
        }
    }

    return (
        <SectionCard
            id="profile-projects"
            title="Projects"
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
                            title={it.title}
                            subtitle={it.link ?? undefined}
                            meta={it.description ?? undefined}
                            onDelete={() => handleRemove(it.id)}
                        />
                    ))}

                    {items.length === 0 && !open && (
                        <EmptyHint label="No projects added yet." />
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
                            saveLabel="Add project"
                        >
                            <Field label="Title" required>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) =>
                                        set("title", e.target.value)
                                    }
                                    placeholder="Real-time chess MMO"
                                    className={inputCls()}
                                />
                            </Field>
                            <Field
                                label="Link"
                                hint="GitHub, Vercel, anywhere."
                            >
                                <input
                                    type="url"
                                    value={form.link ?? ""}
                                    onChange={(e) =>
                                        set("link", e.target.value)
                                    }
                                    placeholder="https://github.com/you/project"
                                    className={inputCls()}
                                />
                            </Field>
                            <Field
                                label="What is it?"
                                hint="One paragraph is plenty."
                            >
                                <textarea
                                    value={form.description ?? ""}
                                    onChange={(e) =>
                                        set("description", e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Multiplayer chess with custom ELO, built in Rust + WASM."
                                    className={`${inputCls()} min-h-24 resize-y py-2`}
                                />
                            </Field>
                        </InlineFormCard>
                    )}
                </div>
            )}
        </SectionCard>
    );
}
