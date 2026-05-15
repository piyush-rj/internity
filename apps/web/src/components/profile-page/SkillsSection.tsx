"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import {
    Field,
    ProfileMissingNotice,
    inputCls,
} from "@/src/components/profile-wizard/utils";
import { SectionCard } from "@/src/components/profile-page/SectionCard";
import { Button } from "@/src/components/ui/button";
import { skillApi, studentApi, type StudentProfile } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

type Suggestion = { id: string; name: string };

export function SkillsSection({
    profile,
    onSaved,
}: {
    profile: StudentProfile | null;
    onSaved: () => Promise<void>;
}) {
    const items = useMemo(() => profile?.skills ?? [], [profile?.skills]);
    const [name, setName] = useState("");
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    const addedNames = useMemo(
        () => new Set(items.map((s) => s.skill.name.toLowerCase())),
        [items],
    );

    // Keep the latest "added names" set in a ref so the autocomplete effect
    // can read it without re-running every time the parent re-renders (which
    // produces a fresh `items` array and, transitively, a fresh Set).
    const addedNamesRef = useRef(addedNames);
    useEffect(() => {
        addedNamesRef.current = addedNames;
    }, [addedNames]);

    // Debounced autocomplete fetch. Only re-runs when the query text changes.
    useEffect(() => {
        const q = name.trim();
        if (q.length < 1) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSuggestions((prev) => (prev.length === 0 ? prev : []));
            return;
        }
        let cancelled = false;
        const handle = setTimeout(async () => {
            try {
                const { items: fetched } = await skillApi.autocomplete(q);
                if (cancelled) return;
                setSuggestions(
                    fetched
                        .filter(
                            (s) =>
                                !addedNamesRef.current.has(
                                    s.name.toLowerCase(),
                                ),
                        )
                        .slice(0, 8),
                );
                setHighlightedIndex(-1);
            } catch {
                /* silent — autocomplete is best-effort */
            }
        }, 200);
        return () => {
            cancelled = true;
            clearTimeout(handle);
        };
    }, [name]);

    // Close the dropdown on outside click.
    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    async function commitSkill(value: string) {
        const trimmed = value.trim();
        if (!trimmed) return;
        if (addedNames.has(trimmed.toLowerCase())) {
            setName("");
            setOpen(false);
            return;
        }
        setAdding(true);
        setError(null);
        try {
            await studentApi.add_skill({ name: trimmed });
            setName("");
            setOpen(false);
            await onSaved();
        } catch (err) {
            setError(
                err instanceof ApiClientError ? err.message : "Couldn’t save.",
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

    // Show "Add new: X" if the query exactly matches nothing in suggestions.
    const trimmedQuery = name.trim();
    const exactMatch = suggestions.some(
        (s) => s.name.toLowerCase() === trimmedQuery.toLowerCase(),
    );
    const showCreate =
        trimmedQuery.length > 0 &&
        !exactMatch &&
        !addedNames.has(trimmedQuery.toLowerCase());

    const dropdownItems: (
        | { kind: "suggestion"; data: Suggestion }
        | {
              kind: "create";
              value: string;
          }
    )[] = [
        ...suggestions.map((s) => ({ kind: "suggestion" as const, data: s })),
        ...(showCreate
            ? [{ kind: "create" as const, value: trimmedQuery }]
            : []),
    ];

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (dropdownItems.length === 0) return;
            setOpen(true);
            setHighlightedIndex((i) =>
                i + 1 >= dropdownItems.length ? 0 : i + 1,
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (dropdownItems.length === 0) return;
            setOpen(true);
            setHighlightedIndex((i) =>
                i <= 0 ? dropdownItems.length - 1 : i - 1,
            );
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (open && highlightedIndex >= 0) {
                const it = dropdownItems[highlightedIndex];
                if (!it) return;
                commitSkill(it.kind === "suggestion" ? it.data.name : it.value);
            } else {
                commitSkill(name);
            }
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    }

    return (
        <SectionCard
            id="profile-skills"
            title="Key skills"
            description="Languages, tools, frameworks — the more specific, the better."
        >
            {!profile ? (
                <ProfileMissingNotice />
            ) : (
                <div className="space-y-4">
                    <Field label="Add a skill">
                        <div className="relative" ref={containerRef}>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setOpen(true);
                                    }}
                                    onFocus={() => setOpen(true)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="React, TypeScript, Figma…"
                                    autoComplete="off"
                                    className={inputCls()}
                                    role="combobox"
                                    aria-autocomplete="list"
                                    aria-expanded={open}
                                    aria-controls="skills-listbox"
                                />
                                <Button
                                    type="button"
                                    variant="exec-dark"
                                    onClick={() => commitSkill(name)}
                                    disabled={adding || !name.trim()}
                                    className="h-10 px-3 text-[13px] cursor-pointer shrink-0"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add
                                </Button>
                            </div>

                            {open && dropdownItems.length > 0 && (
                                <ul
                                    id="skills-listbox"
                                    role="listbox"
                                    className={cn(
                                        "absolute z-20 mt-1 w-[calc(100%-3rem)] max-w-md",
                                        "rounded-lg border border-border bg-card shadow-lg",
                                        "py-1 max-h-64 overflow-y-auto",
                                    )}
                                >
                                    {dropdownItems.map((it, i) => {
                                        const active = i === highlightedIndex;
                                        if (it.kind === "suggestion") {
                                            return (
                                                <li
                                                    key={`s-${it.data.id}`}
                                                    role="option"
                                                    aria-selected={active}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        commitSkill(
                                                            it.data.name,
                                                        );
                                                    }}
                                                    onMouseEnter={() =>
                                                        setHighlightedIndex(i)
                                                    }
                                                    className={cn(
                                                        "px-3 py-1.5 text-[13px] cursor-pointer",
                                                        active
                                                            ? "bg-secondary text-foreground"
                                                            : "text-foreground hover:bg-secondary/60",
                                                    )}
                                                >
                                                    {it.data.name}
                                                </li>
                                            );
                                        }
                                        return (
                                            <li
                                                key="create"
                                                role="option"
                                                aria-selected={active}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    commitSkill(it.value);
                                                }}
                                                onMouseEnter={() =>
                                                    setHighlightedIndex(i)
                                                }
                                                className={cn(
                                                    "px-3 py-1.5 text-[13px] cursor-pointer border-t border-border",
                                                    active
                                                        ? "bg-secondary text-foreground"
                                                        : "text-foreground hover:bg-secondary/60",
                                                )}
                                            >
                                                <span className="text-muted-foreground">
                                                    Add new:
                                                </span>{" "}
                                                <span className="font-medium">
                                                    {it.value}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                        {error && (
                            <span className="mt-1 block text-[11.5px] text-destructive">
                                {error}
                            </span>
                        )}
                    </Field>

                    {items.length === 0 ? (
                        <p className="text-[13px] text-muted-foreground text-center py-3">
                            No skills added yet.
                        </p>
                    ) : (
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
            )}
        </SectionCard>
    );
}
