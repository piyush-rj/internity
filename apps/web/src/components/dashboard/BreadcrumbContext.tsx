"use client";

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

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

// sets the last breadcrumb label while mounted
export function useBreadcrumbLabel(label: string | null): void {
    const ctx = useContext(Ctx);
    useEffect(() => {
        if (!ctx) return;
        ctx.setLabel(label);
        return () => ctx.setLabel(null);
    }, [ctx, label]);
}
