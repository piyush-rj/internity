"use client";
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
    type ForwardedRef,
} from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { CityCombobox } from "@/src/components/ui/CityCombobox";
import { CurrencyCombobox } from "@/src/components/ui/CurrencyCombobox";
import { getCurrencySymbol } from "@/src/lib/catalog/currencies";
import { TagsInput } from "@/src/components/ui/TagsInput";
import { StipendPicker } from "@/src/components/ui/StipendPicker";
import { DurationPicker } from "@/src/components/ui/DurationPicker";
import { BulletList } from "@/src/components/ui/BulletList";
import { PerksPicker } from "@/src/components/manage-listings/PerksPicker";
import { ScreeningQuestionsEditor } from "@/src/components/manage-listings/ScreeningQuestionsEditor";
import { Toggle } from "@/src/components/ui/Toggle";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import {
    listingApi,
    type JobTitle,
    type Listing,
    type ListingInput,
    type ScreeningQuestion,
    type WorkMode,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { JOB_TITLES, jobTitleLabel } from "@/src/lib/catalog/jobTitles";
import { skillSuggestions } from "@/src/lib/catalog/skills";
import {
    LISTING_TEMPLATES,
    type ListingTemplate,
} from "@/src/components/manage-listings/listingTemplates";
import { Wand2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

type StartMode = "IMMEDIATE" | "LATER";

// Exported so the drafts feature can persist/restore the exact form state.
export type ListingFormState = FormState;

type FormState = {
    title: string;
    jobTitle: JobTitle | "";
    customJobTitle: string;
    mode: WorkMode;
    city: string;
    description: string;
    responsibilities: string[];
    perks: string[];
    preferences: string[];
    skillTags: string[];
    screeningQuestions: ScreeningQuestion[];
    currency: string;
    stipendMin: number | null;
    stipendMax: number | null;
    durationMonths: number | null;
    durationWeeks: number | null;
    startMode: StartMode;
    startDate: string;
    startDateLatest: string;
    applyBy: string;
    openings: string;
    partTime: boolean;
    ppo: boolean;
};

const empty: FormState = {
    title: "",
    jobTitle: "",
    customJobTitle: "",
    mode: "ONSITE",
    city: "",
    description: "",
    responsibilities: [],
    perks: [],
    preferences: [],
    skillTags: [],
    screeningQuestions: [],
    currency: "INR",
    stipendMin: null,
    stipendMax: null,
    durationMonths: null,
    durationWeeks: null,
    startMode: "IMMEDIATE",
    startDate: "",
    startDateLatest: "",
    applyBy: "",
    openings: "",
    partTime: false,
    ppo: false,
};

const MAX_SCREENING_QUESTIONS = 3;
const SCREENING_QUESTION_MAX = 200;

// "YYYY-MM-DD" in the viewer's local timezone — used as the `min` on date
// inputs and as the floor for past-date validation at submit. We treat
// today as valid (so you can post a listing starting today).
function todayIso(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export type ListingFormHandle = {
    applyTemplate: (template: ListingTemplate) => void;
};

function fromListing(l: Listing): FormState {
    // "Immediately" = neither end of the range is set. Once either start
    // date is recorded the founder picked "Later" and we surface the range.
    const startMode: StartMode =
        l.startDate || l.startDateLatest ? "LATER" : "IMMEDIATE";
    return {
        title: l.title ?? "",
        jobTitle: l.jobTitle ?? "",
        customJobTitle: l.customJobTitle ?? "",
        mode: l.mode,
        city: l.city ?? "",
        description: l.description ?? "",
        responsibilities: l.responsibilities ?? [],
        perks: l.perks ?? [],
        preferences: l.preferences ?? [],
        skillTags: l.skillTagsRaw ?? [],
        screeningQuestions: l.screeningQuestions ?? [],
        currency: l.currency ?? "INR",
        stipendMin: l.stipendMin,
        stipendMax: l.stipendMax,
        durationMonths: l.durationMonths,
        durationWeeks: l.durationWeeks ?? null,
        startMode,
        startDate: l.startDate ? l.startDate.slice(0, 10) : "",
        startDateLatest: l.startDateLatest
            ? l.startDateLatest.slice(0, 10)
            : "",
        applyBy: l.applyBy ? l.applyBy.slice(0, 10) : "",
        openings: l.openings != null ? String(l.openings) : "",
        partTime: l.partTime ?? false,
        ppo: l.ppo ?? false,
    };
}

// Persist / restore an in-progress new listing as a plain FormState blob in
// localStorage. Used so a signed-out visitor who fills the form and is asked to
// sign up gets their entries back when they return. Merged onto `empty` so a
// stored draft from an older form shape can't leave required keys undefined.
function readDraft(key: string): FormState | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        return { ...empty, ...(JSON.parse(raw) as Partial<FormState>) };
    } catch {
        return null;
    }
}
function writeDraft(key: string, form: FormState) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(form));
    } catch {
        /* quota / disabled storage — drafting is best-effort */
    }
}
function clearDraft(key: string) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(key);
    } catch {
        /* ignore */
    }
}

export const ListingForm = forwardRef(function ListingForm(
    {
        companyId,
        initial,
        onCreated,
        onSaved,
        requireAuth = false,
        onAuthRequired,
        draftKey,
        initialState,
        onSaveDraft,
    }: {
        // Absent for the signed-out (requireAuth) preview, where no listing is
        // actually created until after sign-up + company setup.
        companyId?: string;
        initial?: Listing | null;
        onCreated?: (id: string) => void | Promise<void>;
        onSaved?: (listing: Listing) => void | Promise<void>;
        // When true, a valid submit doesn't hit the API — it saves the draft
        // (if draftKey is set) and calls onAuthRequired so the caller can open
        // the sign-up dialog.
        requireAuth?: boolean;
        onAuthRequired?: () => void;
        // localStorage key for draft persistence (restore on mount, clear on
        // successful create). Only applies in create mode.
        draftKey?: string;
        // Seed the form from a saved DB draft (create mode only).
        initialState?: ListingFormState | null;
        // When set, renders a "Save as draft" button that hands the current
        // (possibly incomplete) form state back to the caller — no validation.
        onSaveDraft?: (state: ListingFormState) => void | Promise<void>;
    },
    ref: ForwardedRef<ListingFormHandle>,
) {
    const isEdit = !!initial;
    const [form, setForm] = useState<FormState>(() =>
        initial
            ? fromListing(initial)
            : initialState
              ? { ...empty, ...initialState }
              : empty,
    );
    const [saving, setSaving] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);

    async function handleSaveDraft() {
        if (!onSaveDraft) return;
        setSavingDraft(true);
        try {
            await onSaveDraft(form);
        } finally {
            setSavingDraft(false);
        }
    }

    // Restore a saved draft after mount (not in the initial state) so the
    // server-rendered empty form and the first client render match — restoring
    // in useState would cause a hydration mismatch on the input values.
    const draftRestored = useRef(false);
    useEffect(() => {
        if (isEdit || !draftKey || draftRestored.current) return;
        draftRestored.current = true;
        const d = readDraft(draftKey);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (d) setForm(d);
    }, [isEdit, draftKey]);

    function set<K extends keyof FormState>(k: K, v: FormState[K]) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    const skillHints = useMemo(
        () => skillSuggestions(form.jobTitle || null),
        [form.jobTitle],
    );

    // applyTemplate has two callers with different intents:
    //  - The top-of-page TemplatePicker is a "seed me" affordance run once
    //    at the start; it should never clobber typed content (overwrite=false).
    //  - The inline "Autofill details" button next to the job-title select
    //    is an explicit "give me this role's defaults"; if the founder
    //    changes job titles and clicks it again they expect fresh defaults,
    //    so it overwrites (overwrite=true).
    function applyTemplate(t: ListingTemplate, overwrite = false) {
        setForm((prev) => {
            const take = <T,>(prevHas: boolean, prevVal: T, fresh: T): T =>
                overwrite || !prevHas ? fresh : prevVal;
            return {
                ...prev,
                mode: overwrite ? t.mode : prev.mode,
                // Always honour the explicit job-title pick the founder
                // already made — never overwrite it from the template.
                jobTitle: prev.jobTitle || (t.jobTitle ?? ""),
                title: take(prev.title.trim().length > 0, prev.title, t.title),
                description: take(
                    prev.description.trim().length > 0,
                    prev.description,
                    t.description,
                ),
                responsibilities: take(
                    prev.responsibilities.some((r) => r.trim()),
                    prev.responsibilities,
                    t.responsibilities,
                ),
                preferences: take(
                    prev.preferences.some((p) => p.trim()),
                    prev.preferences,
                    t.preferences,
                ),
                perks: take(prev.perks.length > 0, prev.perks, t.perks),
                skillTags: take(
                    prev.skillTags.length > 0,
                    prev.skillTags,
                    t.skillTags,
                ),
                // Autofill seeds a single Yes/No screening question rather than
                // the template's own list — keep it to the one most useful for
                // founders to filter on.
                screeningQuestions: take(
                    prev.screeningQuestions.some((q) => q.q.trim()),
                    prev.screeningQuestions,
                    [
                        {
                            q: "Can you join immediately?",
                            type: "YES_NO",
                            idealAnswer: null,
                        },
                    ],
                ),
            };
        });
        toast.success(
            overwrite
                ? `Filled in defaults for ${t.label}. Tweak and post.`
                : `${t.label} template applied — tweak and post.`,
        );
    }

    // Imperative handle from the top-of-page TemplatePicker keeps the
    // conservative "don't clobber typed content" behaviour by default.
    useImperativeHandle(
        ref,
        () => ({ applyTemplate: (t: ListingTemplate) => applyTemplate(t) }),
        [],
    );

    // First template that matches the currently picked job title — used to
    // power the inline "Autofill details" button next to the job-title
    // selector so a founder can one-click prefill description / perks /
    // skills without scrolling up to the template picker.
    const matchingTemplate: ListingTemplate | null = useMemo(() => {
        if (!form.jobTitle || form.jobTitle === "CUSTOM") return null;
        return (
            LISTING_TEMPLATES.find((t) => t.jobTitle === form.jobTitle) ?? null
        );
    }, [form.jobTitle]);

    async function submit() {
        if (!form.jobTitle) {
            toast.error("Pick a job title from the list.");
            return;
        }
        if (form.jobTitle === "CUSTOM" && !form.customJobTitle.trim()) {
            toast.error("Type your custom job title.");
            return;
        }
        // Derive the listing card title from the picked job title — predefined
        // values use the friendly label, CUSTOM uses the typed-in text.
        const titleTrimmed =
            form.jobTitle === "CUSTOM"
                ? form.customJobTitle.trim()
                : jobTitleLabel(form.jobTitle as JobTitle);
        if (!form.description.trim()) {
            toast.error("Please add a short description of the role.");
            return;
        }
        if (form.mode !== "REMOTE" && !form.city.trim()) {
            toast.error("City is required for hybrid and on-site roles.");
            return;
        }
        if (form.stipendMin === null) {
            toast.error("Stipend is required.");
            return;
        }
        if (form.stipendMin <= 0) {
            toast.error("Stipend cannot be 0.");
            return;
        }
        if (form.stipendMax !== null && form.stipendMax <= 0) {
            toast.error("Stipend cannot be 0.");
            return;
        }
        if (form.stipendMax !== null && form.stipendMax < form.stipendMin) {
            toast.error("Max stipend must be at least the min stipend.");
            return;
        }
        const today = todayIso();
        if (form.startMode === "LATER") {
            if (!form.startDate) {
                toast.error("Pick a 'From' date or switch to Immediately.");
                return;
            }
            if (form.startDate < today) {
                toast.error("Start date can't be in the past.");
                return;
            }
            if (form.startDateLatest && form.startDateLatest < today) {
                toast.error("'To' date can't be in the past.");
                return;
            }
            if (form.startDateLatest && form.startDateLatest < form.startDate) {
                toast.error("'To' date can't be before 'From'.");
                return;
            }
        }
        if (form.applyBy && form.applyBy < today) {
            toast.error("'Apply by' can't be in the past.");
            return;
        }

        // Trim each question's text and drop blank ones. Per-type config
        // (options / idealMin / idealAnswer) is left untouched.
        const cleanedQuestions: ScreeningQuestion[] = form.screeningQuestions
            .map((q) => ({ ...q, q: q.q.trim() }))
            .filter((q) => q.q.length > 0);
        const overLength = cleanedQuestions.find(
            (q) => q.q.length > SCREENING_QUESTION_MAX,
        );
        if (overLength) {
            toast.error(
                `Keep each screening question under ${SCREENING_QUESTION_MAX} characters.`,
            );
            return;
        }
        if (cleanedQuestions.length > MAX_SCREENING_QUESTIONS) {
            toast.error(
                `Up to ${MAX_SCREENING_QUESTIONS} screening questions.`,
            );
            return;
        }
        const badMcq = cleanedQuestions.find(
            (q) =>
                q.type === "MULTIPLE_CHOICE" &&
                q.options.filter((o) => o.trim().length > 0).length < 2,
        );
        if (badMcq) {
            toast.error(
                "Multiple-choice questions need at least 2 non-empty options.",
            );
            return;
        }

        // Signed-out preview: the form is valid, but there's no account/company
        // to post under yet. Stash the draft and hand off to the sign-up gate.
        if (requireAuth) {
            if (draftKey) writeDraft(draftKey, form);
            onAuthRequired?.();
            return;
        }

        // Past this point we're creating/updating for real, which needs a
        // company to attribute the listing to.
        if (!companyId) return;

        const input: ListingInput = {
            companyId,
            title: titleTrimmed,
            jobTitle: form.jobTitle as JobTitle,
            customJobTitle:
                form.jobTitle === "CUSTOM" ? form.customJobTitle.trim() : null,
            mode: form.mode,
            city: form.city.trim() || undefined,
            description: form.description.trim(),
            responsibilities: cleanBullets(form.responsibilities),
            perks: form.perks.length > 0 ? form.perks : undefined,
            preferences: cleanBullets(form.preferences),
            skillTagsRaw:
                form.skillTags.length > 0 ? form.skillTags : undefined,
            screeningQuestions:
                cleanedQuestions.length > 0 ? cleanedQuestions : undefined,
            currency: form.currency,
            stipendMin: form.stipendMin,
            stipendMax: form.stipendMax ?? undefined,
            durationMonths: form.durationMonths ?? undefined,
            durationWeeks: form.durationWeeks ?? undefined,
            startDate:
                form.startMode === "LATER" && form.startDate
                    ? new Date(form.startDate).toISOString()
                    : null,
            startDateLatest:
                form.startMode === "LATER" && form.startDateLatest
                    ? new Date(form.startDateLatest).toISOString()
                    : null,
            applyBy: form.applyBy
                ? new Date(form.applyBy).toISOString()
                : undefined,
            openings: numOr(form.openings),
            partTime: form.partTime || undefined,
            ppo: form.ppo,
        };

        setSaving(true);
        try {
            if (isEdit && initial) {
                const { companyId: _omit, ...updateInput } = input;
                void _omit;
                const { listing } = await listingApi.update(
                    initial.id,
                    updateInput,
                );
                toast.success("Listing updated.");
                await onSaved?.(listing);
            } else {
                const { listing } = await listingApi.create(input);
                if (draftKey) clearDraft(draftKey);
                await onCreated?.(listing.id);
            }
        } catch (err) {
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
        <div className="space-y-7">
            <Section title="Basics" number={1}>
                <Field label="Job title" required>
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={form.jobTitle}
                            onChange={(e) =>
                                set("jobTitle", e.target.value as JobTitle | "")
                            }
                            className={cn(
                                inputCls(),
                                "appearance-none pr-8 cursor-pointer flex-1 min-w-50",
                            )}
                        >
                            <option value="">Pick a job title</option>
                            {JOB_TITLES.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                            <option value="CUSTOM">Other (custom)</option>
                        </select>
                        {matchingTemplate && (
                            <Button
                                type="button"
                                variant="exec-light"
                                onClick={() =>
                                    applyTemplate(matchingTemplate, true)
                                }
                                className="h-10 px-3 text-[12.5px] cursor-pointer shrink-0 border-green-400 text-green-700 hover:border-green-500 hover:bg-green-50 shadow-sm shadow-green-200"
                                title={`Replace description, perks, skills, and screening questions with the ${matchingTemplate.label} defaults.`}
                            >
                                <Wand2 className="h-3.5 w-3.5" />
                                Autofill details
                            </Button>
                        )}
                    </div>
                </Field>
                {form.jobTitle === "CUSTOM" && (
                    <Field
                        label="Custom job title"
                        required
                        hint="Shown to students exactly as you type it."
                    >
                        <input
                            type="text"
                            value={form.customJobTitle}
                            onChange={(e) =>
                                set("customJobTitle", e.target.value)
                            }
                            placeholder="e.g. Growth Marketing Intern"
                            maxLength={120}
                            className={inputCls()}
                        />
                    </Field>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Work mode" required>
                        <div className="space-y-2">
                            <SegmentedRadio
                                value={form.mode}
                                onChange={(v) => set("mode", v as WorkMode)}
                                options={[
                                    { value: "REMOTE", label: "Remote" },
                                    { value: "HYBRID", label: "Hybrid" },
                                    { value: "ONSITE", label: "On-site" },
                                ]}
                            />
                        </div>
                    </Field>
                    {form.mode !== "REMOTE" && (
                        <Field label="City" required>
                            <CityCombobox
                                value={form.city}
                                onChange={(v) => set("city", v)}
                                placeholder="Bengaluru"
                            />
                        </Field>
                    )}
                </div>
            </Section>

            <Section title="What the role is about" number={2}>
                <Field label="Description" required>
                    <textarea
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        placeholder="A short overview of the role and what the intern will work on."
                        rows={5}
                        maxLength={4000}
                        className={cn(
                            inputCls(),
                            "h-32 overflow-y-auto py-2 resize-none",
                        )}
                    />
                </Field>
                <Field
                    label="Responsibilities"
                    hint="One point per row. Press Enter to add another."
                >
                    <BulletList
                        value={form.responsibilities}
                        onChange={(v) => set("responsibilities", v)}
                        placeholders={[
                            "Build new UI components",
                            "Ship features end-to-end",
                            "Pair on code review",
                        ]}
                        ariaLabel="Responsibilities"
                        addLabel="Add a responsibility"
                    />
                </Field>
                <Field
                    label="Who can apply"
                    hint="One point per row. Press Enter to add another."
                >
                    <BulletList
                        value={form.preferences}
                        onChange={(v) => set("preferences", v)}
                        placeholders={[
                            "Available 3+ months",
                            "Knows React",
                            "Has shipped a side project",
                        ]}
                        ariaLabel="Who can apply"
                        addLabel="Add a requirement"
                    />
                </Field>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3.5 py-2.5">
                    <span className="text-[13px] font-medium">
                        Does this internship come with a pre-placement offer
                        (PPO)?
                    </span>
                    <Toggle
                        checked={form.ppo}
                        onChange={(on) => set("ppo", on)}
                        ariaLabel="Pre-placement offer"
                    />
                </div>
                <Field
                    label="Perks"
                    hint="Tap to toggle, or pick Custom to type your own."
                >
                    <PerksPicker
                        value={form.perks}
                        onChange={(v) => set("perks", v)}
                    />
                </Field>
                <Field
                    label="Skills"
                    hint={
                        form.jobTitle && form.jobTitle !== "CUSTOM"
                            ? "Suggested for your job title — type to add your own."
                            : "Type to add skills. Suggestions appear as you type."
                    }
                >
                    <TagsInput
                        value={form.skillTags}
                        onChange={(v) => set("skillTags", v)}
                        suggestions={skillHints}
                        placeholder="React, TypeScript, Figma…"
                    />
                </Field>
            </Section>

            <Section
                title={`Screening questions (up to ${MAX_SCREENING_QUESTIONS})`}
                number={3}
            >
                <ScreeningQuestionsEditor
                    questions={form.screeningQuestions}
                    onChange={(next) => set("screeningQuestions", next)}
                />
            </Section>

            <Section title="Compensation & logistics" number={4}>
                <Field label="Currency" required>
                    <div className="max-w-xs">
                        <CurrencyCombobox
                            value={form.currency}
                            onChange={(v) => set("currency", v)}
                        />
                    </div>
                </Field>
                <Field
                    label="Stipend (per month)"
                    hint="Pick a preset or type your own amount."
                    required
                >
                    <StipendPicker
                        min={form.stipendMin}
                        max={form.stipendMax}
                        onMin={(v) => set("stipendMin", v)}
                        onMax={(v) => set("stipendMax", v)}
                        currencySymbol={getCurrencySymbol(form.currency)}
                    />
                </Field>
                <Field
                    label="Duration"
                    hint="Months (0–12) and weeks (0–3). Leave blank if open-ended."
                >
                    <div className="max-w-xs">
                        <DurationPicker
                            months={form.durationMonths}
                            weeks={form.durationWeeks}
                            onMonthsChange={(v) => set("durationMonths", v)}
                            onWeeksChange={(v) => set("durationWeeks", v)}
                        />
                    </div>
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Openings">
                        <OpeningsCombo
                            value={form.openings}
                            onChange={(v) => set("openings", v)}
                        />
                    </Field>
                    <Field label="Part-time / Full-time" required>
                        <div className="flex items-center gap-6 h-10">
                            <PartTimeRadio
                                label="Part-time"
                                checked={form.partTime}
                                onSelect={() => set("partTime", true)}
                            />
                            <PartTimeRadio
                                label="Full-time"
                                checked={!form.partTime}
                                onSelect={() => set("partTime", false)}
                            />
                        </div>
                    </Field>
                </div>
                <Field label="Internship start date" required>
                    <StartDatePicker
                        mode={form.startMode}
                        from={form.startDate}
                        to={form.startDateLatest}
                        onModeChange={(m) => set("startMode", m)}
                        onFromChange={(v) => set("startDate", v)}
                        onToChange={(v) => set("startDateLatest", v)}
                    />
                </Field>
                <Field label="Apply by">
                    <input
                        type="date"
                        value={form.applyBy}
                        min={todayIso()}
                        onChange={(e) => set("applyBy", e.target.value)}
                        className={cn(inputCls(), "max-w-xs")}
                    />
                </Field>
            </Section>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                {onSaveDraft && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={saving || savingDraft}
                        className="h-10 px-4 text-[13px] cursor-pointer"
                    >
                        {savingDraft ? "Saving…" : "Save as draft"}
                    </Button>
                )}
                <Button
                    type="button"
                    variant="exec-dark"
                    onClick={submit}
                    disabled={saving || savingDraft}
                    className="h-10 px-4 text-[13px] cursor-pointer"
                >
                    {saving
                        ? isEdit
                            ? "Saving…"
                            : "Posting…"
                        : isEdit
                          ? "Save changes"
                          : "Post listing"}
                </Button>
            </div>
        </div>
    );
});

function Section({
    title,
    number,
    children,
}: {
    title: string;
    number: number;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border border-border bg-card p-6 space-y-5">
            <h3 className="text-[14px] font-semibold text-[#008080] border-b border-border pb-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#008080] text-white text-[11px] font-bold shrink-0">
                    {number}
                </span>
                {title}
            </h3>
            <div className="space-y-5">{children}</div>
        </section>
    );
}

function StartDatePicker({
    mode,
    from,
    to,
    onModeChange,
    onFromChange,
    onToChange,
}: {
    mode: StartMode;
    from: string;
    to: string;
    onModeChange: (m: StartMode) => void;
    onFromChange: (v: string) => void;
    onToChange: (v: string) => void;
}) {
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-4">
                <StartModeRadio
                    label="Immediately (within next 30 days)"
                    checked={mode === "IMMEDIATE"}
                    onSelect={() => onModeChange("IMMEDIATE")}
                />
                <StartModeRadio
                    label="Later"
                    checked={mode === "LATER"}
                    onSelect={() => onModeChange("LATER")}
                />
            </div>
            {mode === "LATER" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                    <label className="block space-y-1">
                        <span className="block text-[11.5px] font-medium text-muted-foreground">
                            From
                        </span>
                        <input
                            type="date"
                            value={from}
                            min={todayIso()}
                            onChange={(e) => onFromChange(e.target.value)}
                            className={inputCls()}
                        />
                    </label>
                    <label className="block space-y-1">
                        <span className="block text-[11.5px] font-medium text-muted-foreground">
                            To{" "}
                            <span className="font-normal text-muted-foreground/70">
                                (optional)
                            </span>
                        </span>
                        <input
                            type="date"
                            value={to}
                            min={from || todayIso()}
                            onChange={(e) => onToChange(e.target.value)}
                            className={inputCls()}
                        />
                    </label>
                </div>
            )}
        </div>
    );
}

function OpeningsCombo({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!open) return;
        function onDoc(e: MouseEvent) {
            if (
                wrapRef.current &&
                !wrapRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    const currentNum = value.trim() === "" ? null : Number(value);

    return (
        <div className="relative" ref={wrapRef}>
            <div className="flex items-center rounded-md border border-border bg-background focus-within:border-foreground/40 focus-within:ring-3 focus-within:ring-foreground/5">
                <input
                    ref={inputRef}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setOpen(true)}
                    placeholder="2"
                    className="flex-1 bg-transparent outline-none text-[13px] px-3 py-2"
                />
                <button
                    type="button"
                    aria-label="Show openings options"
                    onClick={() => setOpen((o) => !o)}
                    className="px-2 py-2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                    <ChevronDown className="h-3.5 w-3.5" />
                </button>
            </div>
            {open && (
                <div
                    role="listbox"
                    className="absolute z-20 mt-1 left-0 right-0 max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-lg p-1"
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <button
                            key={n}
                            type="button"
                            role="option"
                            aria-selected={currentNum === n}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                onChange(String(n));
                                setOpen(false);
                            }}
                            className={cn(
                                "block w-full text-left px-2 py-1.5 rounded-sm text-[12.5px] cursor-pointer hover:bg-accent",
                                currentNum === n && "bg-secondary",
                            )}
                        >
                            {n}
                        </button>
                    ))}
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                            onChange("");
                            setOpen(false);
                            requestAnimationFrame(() => {
                                inputRef.current?.focus();
                                inputRef.current?.select();
                            });
                        }}
                        className={cn(
                            "block w-full text-left px-2 py-1.5 text-[12.5px] font-medium cursor-pointer",
                            "border-t border-border mt-1 pt-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50",
                        )}
                    >
                        Custom (write your own)
                    </button>
                </div>
            )}
        </div>
    );
}

function PartTimeRadio({
    label,
    checked,
    onSelect,
}: {
    label: string;
    checked: boolean;
    onSelect: () => void;
}) {
    return (
        <label className="inline-flex items-center gap-2 text-[13px] cursor-pointer select-none">
            <input
                type="radio"
                name="part-time-mode"
                checked={checked}
                onChange={onSelect}
                className="sr-only"
            />
            <span
                className={cn(
                    "h-4 w-4 shrink-0 rounded-full border-2 inline-flex items-center justify-center transition-colors",
                    checked ? "border-brand" : "border-border",
                )}
            >
                {checked && <span className="h-2 w-2 rounded-full bg-brand" />}
            </span>
            {label}
        </label>
    );
}

function StartModeRadio({
    label,
    checked,
    onSelect,
}: {
    label: string;
    checked: boolean;
    onSelect: () => void;
}) {
    return (
        <label className="inline-flex items-center gap-2 text-[13px] cursor-pointer select-none">
            <input
                type="radio"
                name="start-mode"
                checked={checked}
                onChange={onSelect}
                className="sr-only"
            />
            <span
                className={cn(
                    "h-4 w-4 shrink-0 rounded-full border-2 inline-flex items-center justify-center transition-colors",
                    checked ? "border-brand" : "border-border",
                )}
            >
                {checked && <span className="h-2 w-2 rounded-full bg-brand" />}
            </span>
            {label}
        </label>
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

function cleanBullets(arr: string[]): string[] | undefined {
    const cleaned = arr.map((x) => x.trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned : undefined;
}

function numOr(s: string): number | undefined {
    if (!s.trim()) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
}
