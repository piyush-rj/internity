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

export function CertificationsStep({
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
    const items = profile?.certifications ?? [];
    const [open, setOpen] = useState(items.length === 0);
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
            await studentApi.remove_certification(id);
            await onSaved();
        } catch {
        }
    }

    return (
        <StepShell
            stepKey="certifications"
            title="Certifications and credentials"
            description="Courses, badges, exam scores — anything that vouches for your skills."
            onBack={onBack}
            onContinue={onContinue}
        >
            <div className="space-y-3">
                {!profile && <ProfileMissingNotice />}

                {items.map((it) => (
                    <EntityCard
                        key={it.id}
                        title={it.name}
                        subtitle={it.issuer ?? undefined}
                        meta={it.issueDate ? fmtDate(it.issueDate) : undefined}
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
                        saveLabel="Add certification"
                    >
                        <Field label="Name" required>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => set("name", e.target.value)}
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
                                    value={form.issueDate?.slice(0, 10) ?? ""}
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
                ) : (
                    profile && (
                        <AddButton
                            label={
                                items.length
                                    ? "Add another"
                                    : "Add certification"
                            }
                            onClick={() => setOpen(true)}
                        />
                    )
                )}
            </div>
        </StepShell>
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
