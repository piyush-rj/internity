"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
    Field,
    ProfileMissingNotice,
    StepShell,
    inputCls,
} from "@/src/components/profile-wizard/utils";
import { studentApi, type StudentProfile } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export function SkillsStep({
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
    const items = profile?.skills ?? [];
    const [name, setName] = useState("");
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleAdd() {
        const trimmed = name.trim();
        if (!trimmed) return;
        setAdding(true);
        setError(null);
        try {
            await studentApi.add_skill({ name: trimmed });
            setName("");
            await onSaved();
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t save. Please try again.",
            );
        } finally {
            setAdding(false);
        }
    }

    async function handleRemove(skillId: string) {
        try {
            await studentApi.remove_skill(skillId);
            await onSaved();
        } catch {
            /* ignore */
        }
    }

    return (
        <StepShell
            stepKey="skills"
            title="Skills you bring to the table"
            description="Languages, tools, frameworks — the more specific, the better."
            onBack={onBack}
            onContinue={onContinue}
        >
            <div className="space-y-4">
                {!profile && <ProfileMissingNotice />}

                {profile && (
                    <Field label="Add a skill">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAdd();
                                    }
                                }}
                                placeholder="React, TypeScript, Figma…"
                                className={inputCls()}
                            />
                            <Button
                                type="button"
                                variant="exec-dark"
                                onClick={handleAdd}
                                disabled={adding || !name.trim()}
                                className="h-10 px-3 text-[13px] cursor-pointer shrink-0"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add
                            </Button>
                        </div>
                        {error && (
                            <span className="mt-1 block text-[11.5px] text-destructive">
                                {error}
                            </span>
                        )}
                    </Field>
                )}

                {items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {items.map((s) => (
                            <span
                                key={s.skill.id}
                                className={cn(
                                    "inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1 rounded-full",
                                    "border border-border bg-background text-[12.5px] text-foreground",
                                )}
                            >
                                {s.skill.name}
                                <button
                                    type="button"
                                    onClick={() => handleRemove(s.skill.id)}
                                    aria-label={`Remove ${s.skill.name}`}
                                    className="h-5 w-5 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </StepShell>
    );
}
