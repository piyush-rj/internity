"use client";

import {
    forwardRef,
    useImperativeHandle,
    useState,
    type ForwardedRef,
} from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import {
    listingApi,
    type ListingInput,
    type ListingType,
    type WorkMode,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import type { ListingTemplate } from "@/src/components/manage-listings/listingTemplates";
import { cn } from "@/src/lib/utils";

type FormState = {
    type: ListingType;
    title: string;
    mode: WorkMode;
    city: string;
    description: string;
    responsibilities: string;
    perks: string;
    preferences: string;
    skillTags: string;
    screeningQuestions: string[];
    stipendMin: string;
    stipendMax: string;
    durationMonths: string;
    startDate: string;
    applyBy: string;
    openings: string;
    partTime: boolean;
};

const empty: FormState = {
    type: "INTERNSHIP",
    title: "",
    mode: "ONSITE",
    city: "",
    description: "",
    responsibilities: "",
    perks: "",
    preferences: "",
    skillTags: "",
    screeningQuestions: [],
    stipendMin: "",
    stipendMax: "",
    durationMonths: "",
    startDate: "",
    applyBy: "",
    openings: "",
    partTime: false,
};

const MAX_SCREENING_QUESTIONS = 5;
const SCREENING_QUESTION_MAX = 200;

export type ListingFormHandle = {
    /** Merge a template's fields into the form. Empty user-filled fields
     *  are overwritten; non-empty ones are preserved. */
    applyTemplate: (template: ListingTemplate) => void;
};

export const ListingForm = forwardRef(function ListingForm(
    {
        companyId,
        onCreated,
    }: {
        companyId: string;
        onCreated: (id: string) => void | Promise<void>;
    },
    ref: ForwardedRef<ListingFormHandle>,
) {
    const [form, setForm] = useState<FormState>(empty);
    const [saving, setSaving] = useState(false);

    function set<K extends keyof FormState>(k: K, v: FormState[K]) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    useImperativeHandle(
        ref,
        () => ({
            applyTemplate: (t) => {
                setForm((prev) => ({
                    ...prev,
                    type: t.type,
                    mode: t.mode,
                    title: prev.title.trim() ? prev.title : t.title,
                    description: prev.description.trim()
                        ? prev.description
                        : t.description,
                    responsibilities: prev.responsibilities.trim()
                        ? prev.responsibilities
                        : t.responsibilities.join("\n"),
                    preferences: prev.preferences.trim()
                        ? prev.preferences
                        : t.preferences.join("\n"),
                    perks: prev.perks.trim()
                        ? prev.perks
                        : t.perks.join("\n"),
                    skillTags: prev.skillTags.trim()
                        ? prev.skillTags
                        : t.skillTags.join(", "),
                    screeningQuestions:
                        prev.screeningQuestions.some((q) => q.trim())
                            ? prev.screeningQuestions
                            : t.screeningQuestions ?? [],
                }));
                toast.success(`${t.label} template applied — tweak and post.`);
            },
        }),
        [],
    );

    async function submit() {
        if (!form.title.trim()) {
            toast.error("Please add a title for the listing.");
            return;
        }
        if (!form.description.trim()) {
            toast.error("Please add a short description of the role.");
            return;
        }
        if (form.mode !== "REMOTE" && !form.city.trim()) {
            toast.error("City is required for hybrid and on-site roles.");
            return;
        }

        const cleanedQuestions = form.screeningQuestions
            .map((q) => q.trim())
            .filter(Boolean);
        const overLength = cleanedQuestions.find(
            (q) => q.length > SCREENING_QUESTION_MAX,
        );
        if (overLength) {
            toast.error(
                `Keep each screening question under ${SCREENING_QUESTION_MAX} characters.`,
            );
            return;
        }

        const input: ListingInput = {
            companyId,
            type: form.type,
            title: form.title.trim(),
            mode: form.mode,
            city: form.city.trim() || undefined,
            description: form.description.trim(),
            responsibilities: splitLines(form.responsibilities),
            perks: splitLines(form.perks),
            preferences: splitLines(form.preferences),
            skillTagsRaw: splitTags(form.skillTags),
            screeningQuestions:
                cleanedQuestions.length > 0 ? cleanedQuestions : undefined,
            stipendMin: numOr(form.stipendMin),
            stipendMax: numOr(form.stipendMax),
            durationMonths: numOr(form.durationMonths),
            startDate: form.startDate
                ? new Date(form.startDate).toISOString()
                : undefined,
            applyBy: form.applyBy
                ? new Date(form.applyBy).toISOString()
                : undefined,
            openings: numOr(form.openings),
            partTime: form.partTime || undefined,
        };

        setSaving(true);
        try {
            const { listing } = await listingApi.create(input);
            await onCreated(listing.id);
        } catch (err) {
            // Backend's verification gate returns 403 FORBIDDEN with a
            // user-friendly message — surface it verbatim so the founder
            // sees "Your company isn't approved by admin yet…" not
            // "FORBIDDEN".
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t create listing.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <Section title="Basics">
                <Field label="Type" required>
                    <SegmentedRadio
                        value={form.type}
                        onChange={(v) => set("type", v as ListingType)}
                        options={[
                            { value: "INTERNSHIP", label: "Internship" },
                            { value: "JOB", label: "Job" },
                        ]}
                    />
                </Field>
                <Field label="Title" required>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => set("title", e.target.value)}
                        placeholder="Frontend Developer Intern"
                        className={inputCls()}
                    />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Work mode" required>
                        <SegmentedRadio
                            value={form.mode}
                            onChange={(v) => set("mode", v as WorkMode)}
                            options={[
                                { value: "REMOTE", label: "Remote" },
                                { value: "HYBRID", label: "Hybrid" },
                                { value: "ONSITE", label: "On-site" },
                            ]}
                        />
                    </Field>
                    <Field
                        label="City"
                        required={form.mode !== "REMOTE"}
                        hint={
                            form.mode === "REMOTE"
                                ? "Optional for remote roles."
                                : undefined
                        }
                    >
                        <input
                            type="text"
                            value={form.city}
                            onChange={(e) => set("city", e.target.value)}
                            placeholder="Bengaluru"
                            className={inputCls()}
                        />
                    </Field>
                </div>
            </Section>

            <Section title="What the role is about">
                <Field label="Description" required>
                    <textarea
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        placeholder="A short overview of the role and what the intern/employee will work on."
                        rows={5}
                        maxLength={4000}
                        className={cn(inputCls(), "min-h-28 py-2 resize-none")}
                    />
                </Field>
                <Field label="Responsibilities" hint="One per line.">
                    <textarea
                        value={form.responsibilities}
                        onChange={(e) =>
                            set("responsibilities", e.target.value)
                        }
                        placeholder={
                            "Build new UI components\nShip features end-to-end"
                        }
                        rows={4}
                        className={cn(inputCls(), "min-h-24 py-2 resize-none")}
                    />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Who can apply" hint="One per line.">
                        <textarea
                            value={form.preferences}
                            onChange={(e) => set("preferences", e.target.value)}
                            placeholder={"Available 3+ months\nKnows React"}
                            rows={4}
                            className={cn(
                                inputCls(),
                                "min-h-24 py-2 resize-none",
                            )}
                        />
                    </Field>
                    <Field label="Perks" hint="One per line.">
                        <textarea
                            value={form.perks}
                            onChange={(e) => set("perks", e.target.value)}
                            placeholder={"Flexible hours\nCertificate"}
                            rows={4}
                            className={cn(
                                inputCls(),
                                "min-h-24 py-2 resize-none",
                            )}
                        />
                    </Field>
                </div>
                <Field
                    label="Skills"
                    hint="Comma-separated. Used for search/filtering."
                >
                    <input
                        type="text"
                        value={form.skillTags}
                        onChange={(e) => set("skillTags", e.target.value)}
                        placeholder="React, TypeScript, Tailwind"
                        className={inputCls()}
                    />
                </Field>
            </Section>

            <Section title="Screening questions (optional)">
                <ScreeningQuestionsEditor
                    questions={form.screeningQuestions}
                    onChange={(next) => set("screeningQuestions", next)}
                />
            </Section>

            <Section title="Compensation & logistics">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Stipend min (₹/mo)">
                        <input
                            type="number"
                            min={0}
                            value={form.stipendMin}
                            onChange={(e) => set("stipendMin", e.target.value)}
                            placeholder="10000"
                            className={inputCls()}
                        />
                    </Field>
                    <Field label="Stipend max (₹/mo)">
                        <input
                            type="number"
                            min={0}
                            value={form.stipendMax}
                            onChange={(e) => set("stipendMax", e.target.value)}
                            placeholder="20000"
                            className={inputCls()}
                        />
                    </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Duration (months)">
                        <input
                            type="number"
                            min={1}
                            max={36}
                            value={form.durationMonths}
                            onChange={(e) =>
                                set("durationMonths", e.target.value)
                            }
                            placeholder="3"
                            className={inputCls()}
                        />
                    </Field>
                    <Field label="Openings">
                        <input
                            type="number"
                            min={1}
                            value={form.openings}
                            onChange={(e) => set("openings", e.target.value)}
                            placeholder="2"
                            className={inputCls()}
                        />
                    </Field>
                    <Field label="Part time">
                        <label className="flex items-center gap-2 h-10 text-[13px] cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.partTime}
                                onChange={(e) =>
                                    set("partTime", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-border accent-brand"
                            />
                            Allow part-time
                        </label>
                    </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Start date">
                        <input
                            type="date"
                            value={form.startDate}
                            onChange={(e) => set("startDate", e.target.value)}
                            className={inputCls()}
                        />
                    </Field>
                    <Field label="Apply by">
                        <input
                            type="date"
                            value={form.applyBy}
                            onChange={(e) => set("applyBy", e.target.value)}
                            className={inputCls()}
                        />
                    </Field>
                </div>
            </Section>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={submit}
                    disabled={saving}
                    className="h-10 px-4 text-[13px] cursor-pointer"
                >
                    {saving ? "Posting…" : "Post listing"}
                </Button>
            </div>
        </div>
    );
});

/* -------------------------------- helpers -------------------------------- */

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3">
            <h3 className="text-[13px] font-semibold text-foreground">
                {title}
            </h3>
            <div className="space-y-3">{children}</div>
        </section>
    );
}

/**
 * Editor for screening questions. Up to MAX_SCREENING_QUESTIONS rows, each
 * capped at SCREENING_QUESTION_MAX chars. Submission filters out blank
 * rows so the founder can leave an empty slot during editing.
 */
function ScreeningQuestionsEditor({
    questions,
    onChange,
}: {
    questions: string[];
    onChange: (next: string[]) => void;
}) {
    function setAt(index: number, value: string) {
        const next = [...questions];
        next[index] = value;
        onChange(next);
    }
    function add() {
        if (questions.length >= MAX_SCREENING_QUESTIONS) return;
        onChange([...questions, ""]);
    }
    function remove(index: number) {
        onChange(questions.filter((_, i) => i !== index));
    }

    return (
        <div className="space-y-2">
            {questions.length === 0 && (
                <p className="text-[12px] text-muted-foreground">
                    Add quick questions students must answer at apply time —
                    great for filtering out spam applications.
                </p>
            )}
            {questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setAt(i, e.target.value)}
                        placeholder={`Question ${i + 1}`}
                        maxLength={SCREENING_QUESTION_MAX}
                        className={cn(inputCls(), "flex-1")}
                    />
                    <button
                        type="button"
                        onClick={() => remove(i)}
                        aria-label={`Remove question ${i + 1}`}
                        className={cn(
                            "h-10 w-10 inline-flex items-center justify-center rounded-md shrink-0",
                            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                            "transition-colors cursor-pointer",
                        )}
                    >
                        ×
                    </button>
                </div>
            ))}
            {questions.length < MAX_SCREENING_QUESTIONS && (
                <button
                    type="button"
                    onClick={add}
                    className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline cursor-pointer"
                >
                    + Add a question
                </button>
            )}
            <p className="text-[11px] text-muted-foreground">
                Up to {MAX_SCREENING_QUESTIONS} questions.{" "}
                {questions.length}/{MAX_SCREENING_QUESTIONS} added.
            </p>
        </div>
    );
}

function SegmentedRadio({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div className="inline-flex h-10 rounded-lg border border-border bg-background p-1 gap-1">
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        onClick={() => onChange(o.value)}
                        className={cn(
                            "px-3 rounded-md text-[12.5px] font-medium transition-colors",
                            active
                                ? "bg-foreground text-background"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

function splitLines(s: string): string[] | undefined {
    const arr = s
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
    return arr.length > 0 ? arr : undefined;
}

function splitTags(s: string): string[] | undefined {
    const arr = s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    return arr.length > 0 ? arr : undefined;
}

function numOr(s: string): number | undefined {
    if (!s.trim()) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
}
