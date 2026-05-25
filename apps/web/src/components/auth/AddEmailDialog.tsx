"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/src/lib/supabase/client";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export function AddEmailDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (next: boolean) => void;
}) {
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function reset() {
        setEmail("");
        setError(null);
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const trimmed = email.trim();
        if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setError("Enter a valid email address.");
            return;
        }

        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({
            email: trimmed,
        });
        setLoading(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }

        toast.success("Check your inbox", {
            description: `We sent a confirmation link to ${trimmed}.`,
        });
        reset();
        onOpenChange(false);
    }

    return (
        <Dialog.Root
            open={open}
            onOpenChange={(next) => {
                if (!next) reset();
                onOpenChange(next);
            }}
        >
            <Dialog.Portal>
                <Dialog.Backdrop
                    className={cn(
                        "fixed inset-0 z-[100]",
                        "bg-black/40 backdrop-blur-[2px]",
                        "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
                        "transition-opacity duration-200",
                    )}
                />
                <Dialog.Popup
                    className={cn(
                        "fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-[380px]",
                        "-translate-x-1/2 -translate-y-1/2",
                        "rounded-lg bg-white px-6 pt-6 pb-5",
                        "shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)] ring-1 ring-black/5",
                        "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
                        "data-[starting-style]:scale-95 data-[ending-style]:scale-95",
                        "transition-[opacity,transform] duration-200 ease-out",
                        "focus:outline-none",
                    )}
                >
                    <Dialog.Close
                        className={cn(
                            "absolute right-3 top-3 z-10",
                            "h-8 w-8 rounded-full inline-flex items-center justify-center",
                            "text-muted-foreground hover:text-foreground hover:bg-muted",
                            "transition-colors cursor-pointer",
                            "focus:outline-none focus:ring-2 focus:ring-ring",
                        )}
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </Dialog.Close>

                    <div className="mb-5">
                        <h2 className="text-[17px] font-semibold tracking-tight">
                            Add an email address
                        </h2>
                        <p className="mt-1 text-[12.5px] text-muted-foreground">
                            We&apos;ll send a confirmation link. Once you click
                            it, this email is linked to your account.
                        </p>
                    </div>

                    {error && (
                        <div
                            className={cn(
                                "mb-3 rounded-md border border-red-200 bg-red-50",
                                "px-3 py-2 text-[12.5px] text-red-700",
                            )}
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="email"
                            autoFocus
                            inputMode="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={cn(
                                "w-full h-10 rounded-lg border border-input bg-white",
                                "px-3 text-[14px] placeholder:text-muted-foreground/60",
                                "focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent",
                            )}
                        />

                        <Button
                            type="submit"
                            variant="exec-dark"
                            disabled={loading}
                            className="w-full h-10 cursor-pointer text-[13px] font-medium"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Sending link…
                                </>
                            ) : (
                                "Send confirmation link"
                            )}
                        </Button>
                    </form>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
