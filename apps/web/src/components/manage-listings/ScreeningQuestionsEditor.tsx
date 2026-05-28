"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Save, Trash2 } from "lucide-react";
import type { ScreeningQuestion, ScreeningResponseType } from "@/src/lib/api";
import { SCREENING_SUGGESTIONS } from "@/src/lib/catalog/screening";
import { cn } from "@/src/lib/utils";

// Each custom-question card: a question textarea + a Response type
// dropdown that swaps the per-type config (options for MCQ, ideal
// answer for Yes/No, ideal min for Numbers / Linear Scale). Each card
// has Save (collapses it to a read-only summary) and Trash buttons in
// the header to match the Internshala spec image.

const MAX_QUESTIONS = 3;
const QUESTION_MAX = 200;

const RESPONSE_LABELS: Record<ScreeningResponseType, string> = {
    SHORT: "Short Answer",
    YES_NO: "Yes/No",
    MULTIPLE_CHOICE: "Multiple choice",
    NUMBERS: "Numbers",
    SCALE_1_5: "Linear Scale (on 1 to 5)",
};

const RESPONSE_TYPES: ScreeningResponseType[] = [
    "YES_NO",
    "MULTIPLE_CHOICE",
    "NUMBERS",
    "SHORT",
    "SCALE_1_5",
];

// Build a fresh question with the picked type and sensible defaults.
function blankQuestion(type: ScreeningResponseType): ScreeningQuestion {
    switch (type) {
        case "SHORT":
            return { q: "", type: "SHORT" };
        case "YES_NO":
            return { q: "", type: "YES_NO", idealAnswer: null };
        case "MULTIPLE_CHOICE":
            return { q: "", type: "MULTIPLE_CHOICE", options: ["", ""] };
        case "NUMBERS":
            return { q: "", type: "NUMBERS", idealMin: null };
        case "SCALE_1_5":
            return { q: "", type: "SCALE_1_5", idealMin: null };
    }
}

export function ScreeningQuestionsEditor({
    questions,
    onChange,
}: {
    questions: ScreeningQuestion[];
    onChange: (next: ScreeningQuestion[]) => void;
}) {
    const remaining = MAX_QUESTIONS - questions.length;

    const unusedSuggestions = useMemo(() => {
        const lowered = new Set(
            questions.map((qq) => qq.q.trim().toLowerCase()),
        );
        return SCREENING_SUGGESTIONS.filter(
            (s) => !lowered.has(s.toLowerCase()),
        );
    }, [questions]);

    function update(index: number, next: ScreeningQuestion) {
        onChange(questions.map((q, i) => (i === index ? next : q)));
    }
    function add(seed?: Partial<ScreeningQuestion>) {
        if (questions.length >= MAX_QUESTIONS) return;
        const base = blankQuestion("SHORT");
        const merged = { ...base, ...seed } as ScreeningQuestion;
        onChange([...questions, merged]);
    }
    function remove(index: number) {
        onChange(questions.filter((_, i) => i !== index));
    }

    return (
        <div className="space-y-3">
            {questions.length === 0 && (
                <p className="text-[12px] text-muted-foreground">
                    Add quick questions students must answer at apply time —
                    great for filtering out spam applications.
                </p>
            )}

            {questions.map((q, i) => (
                <QuestionCard
                    key={i}
                    index={i}
                    question={q}
                    onChange={(next) => update(i, next)}
                    onRemove={() => remove(i)}
                />
            ))}

            {remaining > 0 && (
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => add()}
                        className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline cursor-pointer"
                    >
                        + Add a custom question
                    </button>
                    {unusedSuggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {unusedSuggestions.slice(0, 6).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => add({ q: s, type: "SHORT" })}
                                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11.5px] hover:bg-accent cursor-pointer"
                                >
                                    + {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <p className="text-[11px] text-muted-foreground">
                Up to {MAX_QUESTIONS} questions. {questions.length}/
                {MAX_QUESTIONS} added.
            </p>
        </div>
    );
}

function QuestionCard({
    index,
    question,
    onChange,
    onRemove,
}: {
    index: number;
    question: ScreeningQuestion;
    onChange: (next: ScreeningQuestion) => void;
    onRemove: () => void;
}) {
    // Pre-filled questions (autofill template, suggestion chip click, or
    // editing an existing listing) mount collapsed — they already have a
    // question typed and don't need to be "saved" by the user. Empty cards
    // (manual add) start expanded so the textarea is ready to type into.
    const [collapsed, setCollapsed] = useState(
        () => question.q.trim().length > 0,
    );

    if (collapsed) {
        return (
            <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Custom question {index + 1} ·{" "}
                        {RESPONSE_LABELS[question.type]}
                    </div>
                    <div className="mt-0.5 text-[13px] font-medium truncate">
                        {question.q || "(no question)"}
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => setCollapsed(false)}
                        className="text-[12px] font-medium text-brand hover:underline cursor-pointer px-2"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        aria-label="Delete question"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        );
    }

    function setType(next: ScreeningResponseType) {
        if (next === question.type) return;
        onChange({ ...blankQuestion(next), q: question.q });
    }

    return (
        <div className="rounded-lg border border-border bg-card">
            <header className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-secondary/30 rounded-t-lg">
                <div className="text-[12.5px] font-medium text-foreground">
                    Custom question {index + 1}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setCollapsed(true)}
                        disabled={!question.q.trim()}
                        aria-label="Save question"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Save className="h-3.5 w-3.5" />
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        aria-label="Delete question"
                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </header>

            <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
                    <textarea
                        value={question.q}
                        onChange={(e) =>
                            onChange({ ...question, q: e.target.value })
                        }
                        rows={3}
                        maxLength={QUESTION_MAX}
                        placeholder="Type in your question"
                        className="rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5 resize-none min-h-20"
                    />
                    <ResponseTypeSelect
                        value={question.type}
                        onChange={setType}
                    />
                </div>

                <PerTypeConfig question={question} onChange={onChange} />
            </div>
        </div>
    );
}

function ResponseTypeSelect({
    value,
    onChange,
}: {
    value: ScreeningResponseType;
    onChange: (v: ScreeningResponseType) => void;
}) {
    const [open, setOpen] = useState(false);
    const [focusedIdx, setFocusedIdx] = useState(() =>
        Math.max(0, RESPONSE_TYPES.indexOf(value)),
    );
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

    // Reset focused index to the current value each time the popover opens
    // so arrow keys start from a predictable place.
    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFocusedIdx(Math.max(0, RESPONSE_TYPES.indexOf(value)));
        }
    }, [open, value]);

    // Move browser focus to the currently focused option so screen readers
    // and visual focus rings keep in sync as the user arrows through.
    useEffect(() => {
        if (!open) return;
        optionRefs.current[focusedIdx]?.focus();
    }, [open, focusedIdx]);

    function commit(idx: number) {
        const next = RESPONSE_TYPES[idx];
        if (next) onChange(next);
        setOpen(false);
        // return focus to the trigger so further Tab navigation feels natural
        requestAnimationFrame(() => triggerRef.current?.focus());
    }

    function onTriggerKey(e: React.KeyboardEvent<HTMLButtonElement>) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
        }
    }

    function onOptionKey(
        e: React.KeyboardEvent<HTMLButtonElement>,
        idx: number,
    ) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedIdx((idx + 1) % RESPONSE_TYPES.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedIdx(
                (idx - 1 + RESPONSE_TYPES.length) % RESPONSE_TYPES.length,
            );
        } else if (e.key === "Home") {
            e.preventDefault();
            setFocusedIdx(0);
        } else if (e.key === "End") {
            e.preventDefault();
            setFocusedIdx(RESPONSE_TYPES.length - 1);
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            commit(idx);
        } else if (e.key === "Escape" || e.key === "Tab") {
            setOpen(false);
            if (e.key === "Escape") triggerRef.current?.focus();
        }
    }

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((o) => !o)}
                onKeyDown={onTriggerKey}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="w-full inline-flex items-center justify-between gap-2 rounded-md border border-border bg-background pl-3 pr-3 py-2 text-[13px] cursor-pointer"
            >
                <span>{RESPONSE_LABELS[value]}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {open && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpen(false)}
                        aria-hidden
                    />
                    <div
                        role="listbox"
                        className="absolute z-20 mt-1 left-0 right-0 rounded-md border border-border bg-popover shadow-lg p-1"
                    >
                        {RESPONSE_TYPES.map((t, idx) => (
                            <button
                                ref={(el) => {
                                    optionRefs.current[idx] = el;
                                }}
                                key={t}
                                type="button"
                                role="option"
                                aria-selected={value === t}
                                onClick={() => commit(idx)}
                                onMouseEnter={() => setFocusedIdx(idx)}
                                onKeyDown={(e) => onOptionKey(e, idx)}
                                className={cn(
                                    "block w-full text-left px-2 py-1.5 rounded-sm text-[12.5px] cursor-pointer outline-none",
                                    idx === focusedIdx && "bg-secondary",
                                    value === t && "bg-secondary",
                                )}
                            >
                                {RESPONSE_LABELS[t]}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function PerTypeConfig({
    question,
    onChange,
}: {
    question: ScreeningQuestion;
    onChange: (next: ScreeningQuestion) => void;
}) {
    if (question.type === "SHORT") return null;

    if (question.type === "YES_NO") {
        return (
            <div className="flex items-center gap-4 text-[13px]">
                <span className="text-muted-foreground">Ideal answer:</span>
                <IdealRadio
                    label="Yes"
                    checked={question.idealAnswer === "yes"}
                    onSelect={() =>
                        onChange({ ...question, idealAnswer: "yes" })
                    }
                />
                <IdealRadio
                    label="No"
                    checked={question.idealAnswer === "no"}
                    onSelect={() =>
                        onChange({ ...question, idealAnswer: "no" })
                    }
                />
                {question.idealAnswer && (
                    <button
                        type="button"
                        onClick={() =>
                            onChange({ ...question, idealAnswer: null })
                        }
                        className="text-[11.5px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                        Clear
                    </button>
                )}
            </div>
        );
    }

    if (question.type === "MULTIPLE_CHOICE") {
        const mcq = question; // narrow once; TS can't keep narrowing inside callbacks
        const opts = mcq.options;
        function setOpt(i: number, v: string) {
            const next = opts.slice();
            next[i] = v;
            onChange({ q: mcq.q, type: "MULTIPLE_CHOICE", options: next });
        }
        function add() {
            if (opts.length >= 8) return;
            onChange({
                q: mcq.q,
                type: "MULTIPLE_CHOICE",
                options: [...opts, ""],
            });
        }
        function remove(i: number) {
            if (opts.length <= 2) return;
            onChange({
                q: mcq.q,
                type: "MULTIPLE_CHOICE",
                options: opts.filter((_, idx) => idx !== i),
            });
        }
        return (
            <div className="space-y-2">
                <div className="text-[12.5px] font-medium">Options</div>
                {opts.map((o, i) => (
                    <div key={i} className="flex gap-2">
                        <input
                            type="text"
                            value={o}
                            onChange={(e) => setOpt(i, e.target.value)}
                            placeholder="Type in your option"
                            maxLength={120}
                            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5"
                        />
                        {opts.length > 2 && (
                            <button
                                type="button"
                                onClick={() => remove(i)}
                                aria-label="Remove option"
                                className="h-10 w-10 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}
                {opts.length < 8 && (
                    <button
                        type="button"
                        onClick={add}
                        className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline cursor-pointer"
                    >
                        + Add another option
                    </button>
                )}
            </div>
        );
    }

    if (question.type === "NUMBERS") {
        return (
            <label className="inline-flex items-center gap-2 text-[13px]">
                <span className="text-muted-foreground">
                    Ideal answer (minimum):
                </span>
                <input
                    type="number"
                    value={
                        question.idealMin === null ||
                        question.idealMin === undefined
                            ? ""
                            : question.idealMin
                    }
                    onChange={(e) =>
                        onChange({
                            ...question,
                            idealMin:
                                e.target.value === ""
                                    ? null
                                    : Math.trunc(Number(e.target.value)),
                        })
                    }
                    placeholder="e.g. 99"
                    className="w-32 rounded-md border border-border bg-background px-3 py-1.5 text-[13px] outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5"
                />
            </label>
        );
    }

    // SCALE_1_5
    return (
        <label className="inline-flex items-center gap-2 text-[13px]">
            <span className="text-muted-foreground">
                Ideal answer (minimum, 1–5):
            </span>
            <select
                value={question.idealMin ?? ""}
                onChange={(e) =>
                    onChange({
                        ...question,
                        idealMin:
                            e.target.value === ""
                                ? null
                                : Number(e.target.value),
                    })
                }
                className="rounded-md border border-border bg-background px-3 py-1.5 text-[13px] cursor-pointer"
            >
                <option value="">No minimum</option>
                {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                        {n}
                    </option>
                ))}
            </select>
        </label>
    );
}

function IdealRadio({
    label,
    checked,
    onSelect,
}: {
    label: string;
    checked: boolean;
    onSelect: () => void;
}) {
    return (
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
                type="radio"
                checked={checked}
                onChange={onSelect}
                className="sr-only"
            />
            <span
                className={cn(
                    "h-3.5 w-3.5 shrink-0 rounded-full border-2 inline-flex items-center justify-center",
                    checked ? "border-brand" : "border-border",
                )}
            >
                {checked && (
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                )}
            </span>
            {label}
        </label>
    );
}
