"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field, inputCls } from "@/src/components/profile-wizard/utils";
import {
    listingApi,
    type ListingInput,
    type ListingType,
    type WorkMode,
} from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
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
    stipendMin: "",
    stipendMax: "",
    durationMonths: "",
    startDate: "",
    applyBy: "",
    openings: "",
    partTime: false,
};

export function ListingForm({
    companyId,
    onCreated,
}: {
    companyId: string;
    onCreated: (id: string) => void | Promise<void>;
}) {
    const [form, setForm] = useState<FormState>(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set<K extends keyof FormState>(k: K, v: FormState[K]) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    async function submit() {
        if (!form.title.trim()) {
            setError("Title is required.");
            return;
        }
        if (!form.description.trim()) {
            setError("Description is required.");
            return;
        }
        if (form.mode !== "REMOTE" && !form.city.trim()) {
            setError("City is required for hybrid and on-site roles.");
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
        setError(null);
        try {
            const { listing } = await listingApi.create(input);
            await onCreated(listing.id);
        } catch (err) {
            setError(
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
                        className={cn(inputCls(), "min-h-28 py-2 resize-y")}
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
                        className={cn(inputCls(), "min-h-24 py-2 resize-y")}
                    />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Who can apply" hint="One per line.">
                        <textarea
                            value={form.preferences}
                            onChange={(e) => set("preferences", e.target.value)}
                            placeholder={"Available 3+ months\nKnows React"}
                            rows={4}
                            className={cn(inputCls(), "min-h-24 py-2 resize-y")}
                        />
                    </Field>
                    <Field label="Perks" hint="One per line.">
                        <textarea
                            value={form.perks}
                            onChange={(e) => set("perks", e.target.value)}
                            placeholder={"Flexible hours\nCertificate"}
                            rows={4}
                            className={cn(inputCls(), "min-h-24 py-2 resize-y")}
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

            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

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
}

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
