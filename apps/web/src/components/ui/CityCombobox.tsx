"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { OTHER_CITY_SENTINEL, TOP_INDIAN_CITIES } from "@/src/lib/cities";
import { inputCls } from "@/src/components/profile-wizard/utils";
import { cn } from "@/src/lib/utils";

type Props = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    inputClassName?: string;
};

// city picker backed by a static list with an Other option that reveals a free-text input
export function CityCombobox({
    value,
    onChange,
    placeholder = "Bengaluru",
    disabled,
    invalid,
    inputClassName,
}: Props) {
    const isKnown = useMemo(
        () => TOP_INDIAN_CITIES.includes(value),
        [value],
    );
    const [mode, setMode] = useState<"pick" | "other">(() =>
        value && !isKnown ? "other" : "pick",
    );
    const [query, setQuery] = useState<string>(mode === "pick" ? value : "");
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mode === "pick") setQuery(value);
    }, [value, mode]);

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

    const matches = useMemo(() => {
        const q = query.trim().toLowerCase();
        const filtered = q
            ? TOP_INDIAN_CITIES.filter((c) =>
                  c.toLowerCase().includes(q),
              )
            : [...TOP_INDIAN_CITIES];
        return [...filtered.slice(0, 8), OTHER_CITY_SENTINEL];
    }, [query]);

    function pick(option: string) {
        if (option === OTHER_CITY_SENTINEL) {
            setMode("other");
            setQuery("");
            onChange("");
            setOpen(false);
            return;
        }
        onChange(option);
        setQuery(option);
        setOpen(false);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlightedIndex((i) =>
                i + 1 >= matches.length ? 0 : i + 1,
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            setHighlightedIndex((i) =>
                i <= 0 ? matches.length - 1 : i - 1,
            );
        } else if (e.key === "Enter") {
            if (open && highlightedIndex >= 0) {
                e.preventDefault();
                const opt = matches[highlightedIndex];
                if (opt) pick(opt);
            }
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    }

    if (mode === "other") {
        return (
            <div className="space-y-1.5">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Enter your city"
                    disabled={disabled}
                    className={cn(inputCls(invalid), inputClassName)}
                />
                <button
                    type="button"
                    onClick={() => {
                        setMode("pick");
                        setQuery("");
                        onChange("");
                    }}
                    className="text-[11.5px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                    ← Pick from list
                </button>
            </div>
        );
    }

    return (
        <div className="relative" ref={containerRef}>
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                    if (TOP_INDIAN_CITIES.includes(e.target.value)) {
                        onChange(e.target.value);
                    } else {
                        onChange(e.target.value);
                    }
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={open}
                className={cn(inputCls(invalid), inputClassName)}
            />
            {open && matches.length > 0 && (
                <ul
                    role="listbox"
                    className={cn(
                        "absolute z-20 mt-1 w-full",
                        "rounded-lg border border-border bg-card shadow-lg",
                        "py-1 max-h-64 overflow-y-auto",
                    )}
                >
                    {matches.map((option, i) => {
                        const active = i === highlightedIndex;
                        const isOther = option === OTHER_CITY_SENTINEL;
                        return (
                            <li
                                key={option}
                                role="option"
                                aria-selected={active}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    pick(option);
                                }}
                                onMouseEnter={() => setHighlightedIndex(i)}
                                className={cn(
                                    "px-3 py-1.5 text-[13px] cursor-pointer",
                                    isOther && "border-t border-border",
                                    active
                                        ? "bg-secondary text-foreground"
                                        : "text-foreground hover:bg-secondary/60",
                                )}
                            >
                                {isOther ? (
                                    <span>
                                        <span className="text-muted-foreground">
                                            Other:
                                        </span>{" "}
                                        <span className="font-medium">
                                            type a custom city
                                        </span>
                                    </span>
                                ) : (
                                    option
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
