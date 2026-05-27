"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

// Frontend-only entry point for "join via company code". Founders share the
// invite token (rendered as a "code"); the teammate types it here and we
// route them to /home/invite/[token] where the existing acceptance flow
// validates the code and writes the CompanyMember row.
export default function JoinByCodePage() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        const trimmed = code.trim();
        if (!trimmed) {
            setError("Paste the company code your teammate sent you.");
            return;
        }
        if (!/^[a-z0-9-]+$/i.test(trimmed)) {
            setError(
                "That doesn't look like a company code. Codes are letters, digits, or hyphens only.",
            );
            return;
        }
        router.push(`/home/invite/${trimmed}`);
    }

    return (
        <EmptySection
            title="Join a company"
            description="Got an invite code from a founder? Paste it here and we'll bring you in."
        >
            <form
                onSubmit={onSubmit}
                className="rounded-lg border border-border bg-card p-5 space-y-4 max-w-xl"
            >
                <label className="block space-y-1.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Company code
                    </span>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="Paste the code your teammate shared"
                            autoFocus
                            spellCheck={false}
                            autoComplete="off"
                            className={cn(
                                "w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3",
                                "text-[13px] font-mono tracking-wide",
                                "outline-none focus:border-brand/40 focus:ring-3 focus:ring-brand/15",
                                error && "border-destructive/50",
                            )}
                        />
                    </div>
                    {error && (
                        <p className="text-[12px] text-destructive">{error}</p>
                    )}
                    <p className="text-[11.5px] text-muted-foreground">
                        Codes look like{" "}
                        <span className="font-mono">
                            7b3e0f8a4c2d1e9b5f6a8c1d
                        </span>{" "}
                        and stay valid for 14 days after a founder creates one.
                    </p>
                </label>

                <div className="flex items-center justify-end gap-2">
                    <Button
                        type="submit"
                        variant="exec-dark"
                        className="h-9 px-4 text-[12.5px] rounded-md cursor-pointer"
                    >
                        Continue
                    </Button>
                </div>
            </form>
        </EmptySection>
    );
}
