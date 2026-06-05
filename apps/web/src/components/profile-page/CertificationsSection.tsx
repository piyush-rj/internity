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
    type CertificationInput,
    type StudentProfile,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

const empty: CertificationInput = {
    name: "",
    issuer: "",
    issueDate: "",
    credentialUrl: "",
};

export function CertificationsSection({
    profile,
    onSaved,
}: {
    profile: StudentProfile | null;
    onSaved: () => Promise<void>;
}) {
    const items = profile?.certifications ?? [];
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<CertificationInput>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set<K extends keyof CertificationInput>(
        key: K,
        value: CertificationInput[K],
    ) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function handleAdd() {
        if (!form.name.trim()) {
            setError("Certification name is required.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await studentApi.add_certification({
                name: form.name.trim(),
                issuer: form.issuer?.trim() || undefined,
                issueDate: form.issueDate
                    ? new Date(form.issueDate).toISOString()
                    : undefined,
                credentialUrl: form.credentialUrl?.trim() || undefined,
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
            await studentApi.remove_certification(id);
            await onSaved();
        } catch {}
    }

    return (
        <SectionCard
            id="profile-certifications"
            title="Certifications"
            optional={true}
            tooltip="Courses, certificates, or badges you've earned. Optional — great for showing initiative."
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
                            title={it.name}
                            subtitle={it.issuer ?? undefined}
                            meta={
                                it.issueDate ? fmtDate(it.issueDate) : undefined
                            }
                            onDelete={() => handleRemove(it.id)}
                        />
                    ))}

                    {items.length === 0 && !open && (
                        <EmptyHint label="No certifications added yet." />
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
                            saveLabel="Add certification"
                        >
                            <Field label="Name" required>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) =>
                                        set("name", e.target.value)
                                    }
                                    placeholder="AWS Certified Cloud Practitioner"
                                    className={inputCls()}
                                />
                            </Field>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Issuer">
                                    <input
                                        type="text"
                                        value={form.issuer ?? ""}
                                        onChange={(e) =>
                                            set("issuer", e.target.value)
                                        }
                                        placeholder="Amazon Web Services"
                                        className={inputCls()}
                                    />
                                </Field>
                                <Field label="Issue date">
                                    <input
                                        type="date"
                                        value={
                                            form.issueDate?.slice(0, 10) ?? ""
                                        }
                                        onChange={(e) =>
                                            set("issueDate", e.target.value)
                                        }
                                        className={inputCls()}
                                    />
                                </Field>
                            </div>
                            <Field label="Credential URL">
                                <input
                                    type="url"
                                    value={form.credentialUrl ?? ""}
                                    onChange={(e) =>
                                        set("credentialUrl", e.target.value)
                                    }
                                    placeholder="https://verify.example.com/abc123"
                                    className={inputCls()}
                                />
                            </Field>
                        </InlineFormCard>
                    )}
                </div>
            )}
        </SectionCard>
    );
}

function fmtDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}
