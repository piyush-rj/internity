"use client";

import { useCallback, useRef, useState } from "react";
import type { PromptDialogProps } from "@/src/components/ui/PromptDialog";

type PromptOptions = Omit<
    PromptDialogProps,
    "open" | "onCancel" | "onConfirm" | "busy"
>;

type PromptState = PromptOptions & { busy: boolean };

// imperative prompt api. Resolves with the entered string when the
// user confirms, or null when they cancel.
export function usePrompt() {
    const [state, setState] = useState<PromptState | null>(null);
    const resolverRef = useRef<((value: string | null) => void) | null>(null);

    const finish = useCallback((value: string | null) => {
        const r = resolverRef.current;
        resolverRef.current = null;
        setState(null);
        r?.(value);
    }, []);

    const prompt = useCallback(
        (opts: PromptOptions): Promise<string | null> => {
            if (resolverRef.current) {
                resolverRef.current(null);
            }
            setState({ ...opts, busy: false });
            return new Promise<string | null>((resolve) => {
                resolverRef.current = resolve;
            });
        },
        [],
    );

    const dialogProps: PromptDialogProps = {
        open: state !== null,
        title: state?.title ?? "",
        description: state?.description,
        placeholder: state?.placeholder,
        defaultValue: state?.defaultValue,
        confirmLabel: state?.confirmLabel,
        cancelLabel: state?.cancelLabel,
        multiline: state?.multiline,
        required: state?.required,
        requiredError: state?.requiredError,
        maxLength: state?.maxLength,
        variant: state?.variant,
        busy: state?.busy ?? false,
        onCancel: () => finish(null),
        onConfirm: (value) => finish(value),
    };

    return { prompt, dialogProps };
}
