"use client";

import type { ScreeningAnswer, ScreeningQuestion } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

const SHORT_LIMIT = 500;

// Renders the right input control for the question type. Parent owns the
// answer state and passes it through; we just call onChange with the new
// shape ({ value: string | number }) on every edit.

export function ScreeningAnswerInput({
    index,
    question,
    answer,
    onChange,
}: {
    index: number;
    question: ScreeningQuestion;
    answer: ScreeningAnswer | undefined;
    onChange: (a: ScreeningAnswer) => void;
}) {
    const labelPrefix = (
        <span className="font-medium tabular-nums text-muted-foreground">
            Q{index + 1}.
        </span>
    );

    if (question.type === "SHORT") {
        const value =
            typeof answer?.value === "string" ? answer.value : "";
        const over = value.length > SHORT_LIMIT;
        return (
            <label className="block space-y-1">
                <span className="block text-[12.5px] text-foreground/90">
                    {labelPrefix} {question.q}
                </span>
                <textarea
                    value={value}
                    onChange={(e) => onChange({ value: e.target.value })}
                    rows={3}
                    maxLength={SHORT_LIMIT}
                    placeholder="Your answer"
                    className={cn(
                        "w-full rounded-lg border bg-background px-3 py-2",
                        "text-[13px] placeholder:text-muted-foreground/70",
                        "outline-none focus:ring-3 focus:ring-foreground/5",
                        "resize-none h-24",
                        over
                            ? "border-destructive/50 focus:border-destructive/60"
                            : "border-border focus:border-foreground/40",
                    )}
                />
            </label>
        );
    }

    if (question.type === "YES_NO") {
        const value = answer?.value === "yes" || answer?.value === "no"
            ? answer.value
            : null;
        return (
            <fieldset className="space-y-1.5">
                <legend className="block text-[12.5px] text-foreground/90">
                    {labelPrefix} {question.q}
                </legend>
                <div className="flex items-center gap-4 text-[13px]">
                    <RadioPill
                        label="Yes"
                        checked={value === "yes"}
                        onSelect={() => onChange({ value: "yes" })}
                    />
                    <RadioPill
                        label="No"
                        checked={value === "no"}
                        onSelect={() => onChange({ value: "no" })}
                    />
                </div>
            </fieldset>
        );
    }

    if (question.type === "MULTIPLE_CHOICE") {
        const value =
            typeof answer?.value === "string" ? answer.value : "";
        return (
            <fieldset className="space-y-1.5">
                <legend className="block text-[12.5px] text-foreground/90">
                    {labelPrefix} {question.q}
                </legend>
                <div className="flex flex-col gap-1.5">
                    {question.options.map((o) => (
                        <RadioPill
                            key={o}
                            label={o}
                            checked={value === o}
                            onSelect={() => onChange({ value: o })}
                        />
                    ))}
                </div>
            </fieldset>
        );
    }

    if (question.type === "NUMBERS") {
        const raw =
            typeof answer?.value === "number"
                ? String(answer.value)
                : typeof answer?.value === "string"
                  ? answer.value
                  : "";
        return (
            <label className="block space-y-1">
                <span className="block text-[12.5px] text-foreground/90">
                    {labelPrefix} {question.q}
                </span>
                <input
                    type="number"
                    inputMode="numeric"
                    value={raw}
                    onChange={(e) => {
                        const t = e.target.value;
                        if (t === "") {
                            onChange({ value: "" });
                            return;
                        }
                        const n = Number(t);
                        onChange({
                            value: Number.isFinite(n) ? Math.trunc(n) : t,
                        });
                    }}
                    placeholder="e.g. 5"
                    className="w-40 rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5"
                />
            </label>
        );
    }

    // SCALE_1_5
    const current =
        typeof answer?.value === "number" && answer.value >= 1 && answer.value <= 5
            ? answer.value
            : null;
    return (
        <fieldset className="space-y-1.5">
            <legend className="block text-[12.5px] text-foreground/90">
                {labelPrefix} {question.q}
            </legend>
            <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange({ value: n })}
                        className={cn(
                            "h-9 w-9 rounded-md border text-[13px] font-medium cursor-pointer transition-colors",
                            current === n
                                ? "border-foreground/40 bg-foreground/5 text-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-secondary/40",
                        )}
                    >
                        {n}
                    </button>
                ))}
                <span className="text-[11px] text-muted-foreground ml-2">
                    1 = low · 5 = high
                </span>
            </div>
        </fieldset>
    );
}

function RadioPill({
    label,
    checked,
    onSelect,
}: {
    label: string;
    checked: boolean;
    onSelect: () => void;
}) {
    return (
        <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
                type="radio"
                checked={checked}
                onChange={onSelect}
                className="sr-only"
            />
            <span
                className={cn(
                    "h-4 w-4 shrink-0 rounded-full border-2 inline-flex items-center justify-center",
                    checked ? "border-brand" : "border-border",
                )}
            >
                {checked && (
                    <span className="h-2 w-2 rounded-full bg-brand" />
                )}
            </span>
            {label}
        </label>
    );
}

// Returns true if the answer is non-empty / well-formed for the question's
// type. Used by the apply card to enable the submit button.
export function isAnswered(
    question: ScreeningQuestion,
    answer: ScreeningAnswer | undefined,
): boolean {
    if (!answer) return false;
    const v = answer.value;
    switch (question.type) {
        case "SHORT":
            return typeof v === "string" && v.trim().length > 0;
        case "YES_NO":
            return v === "yes" || v === "no";
        case "MULTIPLE_CHOICE":
            return typeof v === "string" && question.options.includes(v);
        case "NUMBERS": {
            const n = typeof v === "number" ? v : Number(v);
            return Number.isFinite(n);
        }
        case "SCALE_1_5":
            return typeof v === "number" && v >= 1 && v <= 5;
    }
}
