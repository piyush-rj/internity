"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Field,
    ProfileMissingNotice,
    inputCls,
} from "@/src/components/profile-wizard/utils";
import { SectionCard } from "@/src/components/profile-page/SectionCard";
import { studentApi, type StudentProfile } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { Button } from "@/src/components/ui/button";

type FormState = { from: string; to: string };

// Default both ends to midnight so the inputs show "00:00" instead of empty
// "--:--" dashes. The saved profile drives completion, so an unsaved default
// here doesn't count the step as done.
const DEFAULT_TIME = "00:00";

function fromProfile(p: StudentProfile | null): FormState {
    return {
        from: p?.interviewStartTime ?? DEFAULT_TIME,
        to: p?.interviewEndTime ?? DEFAULT_TIME,
    };
}

export function InterviewPreferencesSection({
    profile,
    onSaved,
}: {
    profile: StudentProfile | null;
    onSaved: () => Promise<void>;
}) {
    const [form, setForm] = useState<FormState>(() => fromProfile(profile));
    const [saving, setSaving] = useState(false);
    // Resolved on the client only — the server's timezone would differ and
    // cause a hydration mismatch.
    const [tz, setTz] = useState<string>("");

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm(fromProfile(profile));
    }, [profile]);

    useEffect(() => {
        try {
            const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const short = new Intl.DateTimeFormat(undefined, {
                timeZoneName: "short",
            })
                .formatToParts(new Date())
                .find((p) => p.type === "timeZoneName")?.value;
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTz(short ? `${zone} (${short})` : zone);
        } catch {
            /* Intl unavailable — just omit the timezone hint */
        }
    }, []);

    async function handleSave() {
        const { from, to } = form;
        if (!from || !to) {
            toast.error("Pick a start and end time for your availability.");
            return;
        }
        if (from >= to) {
            toast.error("End time must be after the start time.");
            return;
        }

        setSaving(true);
        try {
            await studentApi.update({
                interviewStartTime: from || null,
                interviewEndTime: to || null,
            });
            await onSaved();
            toast.success("Interview availability saved.");
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
        <SectionCard
            id="profile-interviewPrefs"
            title="Interview Preferences"
            tooltip="Let companies know when you're available for interview calls — set a daily time window that works for you."
        >
            {!profile ? (
                <ProfileMissingNotice />
            ) : (
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[12.5px] text-muted-foreground">
                            Make sure you are available at this time daily to
                            take interview calls.
                        </p>
                        {tz && (
                            <p className="text-[12px] text-muted-foreground">
                                Times are in your local timezone - {tz}.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Available from">
                            <input
                                type="time"
                                value={form.from}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        from: e.target.value,
                                    }))
                                }
                                className={inputCls()}
                            />
                        </Field>
                        <Field label="Available until">
                            <input
                                type="time"
                                value={form.to}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        to: e.target.value,
                                    }))
                                }
                                className={inputCls()}
                            />
                        </Field>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving…" : "Save"}
                        </Button>
                    </div>
                </div>
            )}
        </SectionCard>
    );
}
