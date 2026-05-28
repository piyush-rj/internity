"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { createClient } from "@/src/lib/supabase/client";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export type AuthFlowProps = {
    nextPath?: string;
    onComplete?: () => void;
    embedded?: boolean;
};

// Sign-in is Google-only. The previous phone/OTP flow has been removed;
// after Google OAuth, /auth/callback exchanges the code and redirects
// to nextPath, so this component only needs to fire the OAuth handoff.
export function AuthFlow({
    nextPath = "/home/dashboard",
    embedded = false,
}: AuthFlowProps) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleGoogleSignIn() {
        setError(null);
        setLoading(true);
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
            },
        });
        if (oauthError) {
            setError(oauthError.message);
            setLoading(false);
        }
    }

    return (
        <div
            className={cn(
                "w-full",
                embedded ? "px-1 pt-1 pb-1" : "px-2 pt-4 pb-2",
            )}
        >
            <div className="text-left mb-5">
                <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
                    Sign in to SpiderSkill
                </h2>
                <p className="text-[12.5px] text-muted-foreground mt-1">
                    Continue with your Google account.
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

            <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className={cn(
                    "w-full h-11 cursor-pointer text-[13.5px] font-medium",
                    "justify-center gap-2.5",
                )}
            >
                <FcGoogle className="h-4.5 w-4.5" />
                Continue with Google
            </Button>

            <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
                By continuing, you agree to SpiderSkill&apos;s Terms of Service
                and Privacy Policy.
            </p>
        </div>
    );
}
