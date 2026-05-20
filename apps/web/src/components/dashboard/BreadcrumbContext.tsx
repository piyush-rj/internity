"use client";

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

/**
 * Lets a page override the final breadcrumb crumb in the topbar — useful for
 * detail routes where the URL segment is an opaque id (e.g. a listing cuid).
 *
 * Usage: `useBreadcrumbLabel(listing.company.name)` from any client component
 * inside `app/home/*`. Pass `null` (or skip the call) to fall back to the
 * URL-derived label.
 */

type BreadcrumbCtx = {
    label: string | null;
    setLabel: (label: string | null) => void;
};

const Ctx = createContext<BreadcrumbCtx | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [label, setLabel] = useState<string | null>(null);
    const value = useMemo(() => ({ label, setLabel }), [label]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBreadcrumbOverride(): string | null {
    return useContext(Ctx)?.label ?? null;
}

/** Set the last breadcrumb label while this component is mounted. */
export function useBreadcrumbLabel(label: string | null): void {
    const ctx = useContext(Ctx);
    useEffect(() => {
        if (!ctx) return;
        ctx.setLabel(label);
        return () => ctx.setLabel(null);
    }, [ctx, label]);
}
