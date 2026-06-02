"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CURRENCIES, getCurrencySymbol } from "@/src/lib/catalog/currencies";
import { inputCls } from "@/src/components/profile-wizard/utils";
import { cn } from "@/src/lib/utils";

type Props = {
    value: string;
    onChange: (code: string) => void;
    disabled?: boolean;
};

export function CurrencyCombobox({ value, onChange, disabled }: Props) {
    const [searchQuery, setSearchQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    const displayValue = open
        ? searchQuery
        : value
          ? `${getCurrencySymbol(value)} ${value}`
          : "";

    function onDown(e: MouseEvent) {
        if (
            containerRef.current &&
            !containerRef.current.contains(e.target as Node)
        ) {
            setOpen(false);
        }
    }

    useEffect(() => {
        if (!open) return;
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    const matches = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return CURRENCIES.slice();
        return CURRENCIES.filter(
            (c) =>
                c.code.toLowerCase().includes(q) ||
                c.name.toLowerCase().includes(q),
        );
    }, [searchQuery]);

    function pick(code: string) {
        onChange(code);
        setSearchQuery("");
        setOpen(false);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlightedIndex((i) => (i + 1 >= matches.length ? 0 : i + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            setHighlightedIndex((i) => (i <= 0 ? matches.length - 1 : i - 1));
        } else if (e.key === "Enter") {
            if (open && highlightedIndex >= 0) {
                e.preventDefault();
                const opt = matches[highlightedIndex];
                if (opt) pick(opt.code);
            }
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    }

    return (
        <div className="relative" ref={containerRef}>
            <input
                type="text"
                value={displayValue}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setOpen(true);
                    setHighlightedIndex(-1);
                }}
                onFocus={() => {
                    setSearchQuery("");
                    setOpen(true);
                }}
                onBlur={() => {
                    setTimeout(() => {
                        setOpen(false);
                    }, 150);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search currency…"
                disabled={disabled}
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls="currency-combobox-listbox"
                className={inputCls()}
            />
            {open && matches.length > 0 && (
                <ul
                    id="currency-combobox-listbox"
                    role="listbox"
                    className={cn(
                        "absolute z-20 mt-1 w-full",
                        "rounded-lg border border-border bg-card shadow-lg",
                        "py-1 max-h-56 overflow-y-auto",
                    )}
                >
                    {matches.map((c, i) => {
                        const active = i === highlightedIndex;
                        return (
                            <li
                                key={c.code}
                                role="option"
                                aria-selected={active}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    pick(c.code);
                                }}
                                onMouseEnter={() => setHighlightedIndex(i)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 text-[13px] cursor-pointer",
                                    active
                                        ? "bg-secondary text-foreground"
                                        : "text-foreground hover:bg-secondary/60",
                                )}
                            >
                                <span className="w-7 shrink-0 text-muted-foreground font-mono text-[12px]">
                                    {c.symbol}
                                </span>
                                <span className="font-medium">{c.code}</span>
                                <span className="text-muted-foreground truncate">
                                    {c.name}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
