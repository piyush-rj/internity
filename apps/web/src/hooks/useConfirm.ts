"use client";

import { useCallback, useRef, useState } from "react";
import type { ConfirmDialogProps } from "@/src/components/ui/ConfirmDialog";

type ConfirmOptions = Omit<
    ConfirmDialogProps,
    "open" | "onCancel" | "onConfirm" | "busy"
>;

type ConfirmState = ConfirmOptions & { busy: boolean };

// imperative confirmation api returning a promise of the user's choice
export function useConfirm() {
    const [state, setState] = useState<ConfirmState | null>(null);
    const resolverRef = useRef<((value: boolean) => void) | null>(null);

    const finish = useCallback((value: boolean) => {
        const r = resolverRef.current;
        resolverRef.current = null;
        setState(null);
        r?.(value);
    }, []);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        if (resolverRef.current) {
            resolverRef.current(false);
        }
        setState({ ...opts, busy: false });
        return new Promise<boolean>((resolve) => {
            resolverRef.current = resolve;
        });
    }, []);

    const dialogProps: ConfirmDialogProps = {
        open: state !== null,
        title: state?.title ?? "",
        description: state?.description,
        confirmLabel: state?.confirmLabel,
        cancelLabel: state?.cancelLabel,
        variant: state?.variant,
        busy: state?.busy ?? false,
        onCancel: () => finish(false),
        onConfirm: () => finish(true),
    };

    return { confirm, dialogProps };
}
