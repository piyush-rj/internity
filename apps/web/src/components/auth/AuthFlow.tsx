"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { Phone, ChevronLeft, Loader2, Check } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import { authApi } from "@/src/lib/api/auth";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMeStore } from "@/src/store/useMeStore";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

type Step =
    | "provider-select"
    | "phone-input"
    | "phone-verify"
    | "name-input"
    | "complete";

type Direction = 1 | -1;

const PANEL_TRANSITION = {
    type: "spring" as const,
    stiffness: 360,
    damping: 32,
    mass: 0.6,
};

export type AuthFlowProps = {
    /** Where to send the user when sign-in completes. */
    nextPath?: string;
    /** Called after the flow finishes successfully (e.g. close modal). */
    onComplete?: () => void;
    /** Slightly tighter spacing when embedded in a modal vs a full page. */
    embedded?: boolean;
};

export function AuthFlow({
    nextPath = "/home/dashboard",
    onComplete,
    embedded = false,
}: AuthFlowProps) {
    const supabase = createClient();
    const refetchMe = useMeStore((s) => s.refetch);

    const [step, setStep] = useState<Step>("provider-select");
    const [direction, setDirection] = useState<Direction>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const goTo = useCallback((next: Step, dir: Direction = 1) => {
        setError(null);
        setDirection(dir);
        setStep(next);
    }, []);

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
        // On success the page navigates to Google — nothing else to do here.
    }

    async function handleSendOtp(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const trimmed = phone.trim();
        if (!trimmed.startsWith("+") || trimmed.length < 8) {
            setError("Enter phone in international format, e.g. +919876543210");
            return;
        }
        setLoading(true);
        const { error: otpError } = await supabase.auth.signInWithOtp({
            phone: trimmed,
        });
        setLoading(false);
        if (otpError) {
            setError(otpError.message);
            return;
        }
        setOtp("");
        goTo("phone-verify");
    }

    async function handleVerifyOtp(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (otp.trim().length < 4) {
            setError("Enter the code we sent you.");
            return;
        }
        setLoading(true);
        const { error: verifyError } = await supabase.auth.verifyOtp({
            phone: phone.trim(),
            token: otp.trim(),
            type: "sms",
        });
        if (verifyError) {
            setLoading(false);
            setError(verifyError.message);
            return;
        }

        // Verified. Decide between onboarding (new user, no name) and finish.
        try {
            const me = await authApi.me();
            setLoading(false);
            if (me.needsOnboarding) {
                goTo("name-input");
            } else {
                await finish();
            }
        } catch (err) {
            setLoading(false);
            // /auth/me failing right after verifyOtp likely means the DB
            // trigger hasn't fired yet (rare). Send them to onboarding —
            // the name PATCH retries lazy-link via supabaseUserId.
            if (
                err instanceof ApiClientError &&
                (err.status === 401 || err.status === 404)
            ) {
                goTo("name-input");
                return;
            }
            setError(
                err instanceof Error ? err.message : "Something went wrong.",
            );
        }
    }

    async function handleSaveName(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const fullName = [firstName.trim(), lastName.trim()]
            .filter(Boolean)
            .join(" ");
        if (!fullName) {
            setError("Enter your first name.");
            return;
        }
        setLoading(true);
        try {
            await authApi.update_me({ name: fullName });
            await finish();
        } catch (err) {
            setLoading(false);
            setError(
                err instanceof Error ? err.message : "Could not save name.",
            );
        }
    }

    async function finish() {
        goTo("complete");
        // Refresh /auth/me into the Zustand store so the dashboard sees the
        // freshly-saved name without an extra round-trip.
        await refetchMe().catch(() => {});
        // Brief pause to show the success state — feels intentional, not jank.
        await new Promise((r) => setTimeout(r, 350));
        onComplete?.();
        if (typeof window !== "undefined") {
            window.location.assign(nextPath);
        }
    }

    return (
        <div
            className={cn(
                "w-full",
                embedded ? "px-1 pt-1 pb-1" : "px-2 pt-4 pb-2",
            )}
        >
            <Header step={step} phone={phone} />

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

            <div className="relative overflow-hidden">
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                    <motion.div
                        key={step}
                        custom={direction}
                        initial={{ opacity: 0, x: direction * 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -24 }}
                        transition={PANEL_TRANSITION}
                        className="w-full"
                    >
                        {step === "provider-select" && (
                            <ProviderSelect
                                loading={loading}
                                onGoogle={handleGoogleSignIn}
                                onPhone={() => goTo("phone-input")}
                            />
                        )}

                        {step === "phone-input" && (
                            <PhoneInputPanel
                                phone={phone}
                                loading={loading}
                                onChange={setPhone}
                                onBack={() => goTo("provider-select", -1)}
                                onSubmit={handleSendOtp}
                            />
                        )}

                        {step === "phone-verify" && (
                            <PhoneVerifyPanel
                                phone={phone}
                                otp={otp}
                                loading={loading}
                                onChange={setOtp}
                                onBack={() => goTo("phone-input", -1)}
                                onSubmit={handleVerifyOtp}
                            />
                        )}

                        {step === "name-input" && (
                            <NameInputPanel
                                firstName={firstName}
                                lastName={lastName}
                                loading={loading}
                                onFirstNameChange={setFirstName}
                                onLastNameChange={setLastName}
                                onSubmit={handleSaveName}
                            />
                        )}

                        {step === "complete" && <CompletePanel />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

function Header({ step, phone }: { step: Step; phone: string }) {
    const headings: Record<Step, { title: string; sub: string }> = {
        "provider-select": {
            title: "Sign in to SpiderSkill",
            sub: "Use Google or your phone number to continue.",
        },
        "phone-input": {
            title: "Sign in with phone",
            sub: "We'll send you a 6-digit code over SMS.",
        },
        "phone-verify": {
            title: "Enter your code",
            sub: phone
                ? `Sent to ${phone}. Code is good for 60 seconds.`
                : "Check your messages.",
        },
        "name-input": {
            title: "Finish setting up your account",
            sub: "Tell us your name so employers and others can see who you are.",
        },
        complete: {
            title: "You're in",
            sub: "Taking you to your dashboard…",
        },
    };
    const { title, sub } = headings[step];
    return (
        <div className="text-left mb-5">
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
                {title}
            </h2>
            <p className="text-[12.5px] text-muted-foreground mt-1">{sub}</p>
        </div>
    );
}

function ProviderSelect({
    loading,
    onGoogle,
    onPhone,
}: {
    loading: boolean;
    onGoogle: () => void;
    onPhone: () => void;
}) {
    return (
        <div className="space-y-2.5">
            <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={onGoogle}
                className={cn(
                    "w-full h-11 cursor-pointer text-[13.5px] font-medium",
                    "justify-center gap-2.5",
                )}
            >
                <FcGoogle className="h-[18px] w-[18px]" />
                Continue with Google
            </Button>

            <div className="flex items-center gap-3 my-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                    or
                </span>
                <div className="h-px flex-1 bg-border" />
            </div>

            <Button
                type="button"
                variant="exec-dark"
                disabled={loading}
                onClick={onPhone}
                className={cn(
                    "w-full h-11 cursor-pointer text-[13.5px] font-medium",
                    "justify-center gap-2",
                )}
            >
                <Phone className="h-4 w-4" />
                Continue with phone
            </Button>

            <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
                By continuing, you agree to SpiderSkill&apos;s Terms of Service
                and Privacy Policy.
            </p>
        </div>
    );
}

function PhoneInputPanel({
    phone,
    loading,
    onChange,
    onBack,
    onSubmit,
}: {
    phone: string;
    loading: boolean;
    onChange: (v: string) => void;
    onBack: () => void;
    onSubmit: (e: React.FormEvent) => void;
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <Field label="Phone number" hint="Include country code, e.g. +91.">
                <input
                    type="tel"
                    autoFocus
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+919876543210"
                    value={phone}
                    onChange={(e) => onChange(e.target.value)}
                    className={inputClass}
                />
            </Field>

            <Button
                type="submit"
                variant="exec-dark"
                disabled={loading}
                className="w-full h-11 cursor-pointer text-[13.5px] font-medium"
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending code…
                    </>
                ) : (
                    "Send code"
                )}
            </Button>
            <BackButton onClick={onBack} disabled={loading} />
        </form>
    );
}

function PhoneVerifyPanel({
    phone,
    otp,
    loading,
    onChange,
    onBack,
    onSubmit,
}: {
    phone: string;
    otp: string;
    loading: boolean;
    onChange: (v: string) => void;
    onBack: () => void;
    onSubmit: (e: React.FormEvent) => void;
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <Field label="Verification code" hint={`Sent to ${phone}.`}>
                <input
                    type="text"
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) =>
                        onChange(e.target.value.replace(/\s/g, ""))
                    }
                    maxLength={6}
                    className={cn(
                        inputClass,
                        "text-center text-[18px] tracking-[0.5em] placeholder:tracking-normal placeholder:text-muted-foreground/50",
                    )}
                />
            </Field>

            <Button
                type="submit"
                variant="exec-dark"
                disabled={loading}
                className="w-full h-11 cursor-pointer text-[13.5px] font-medium"
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying…
                    </>
                ) : (
                    "Verify and continue"
                )}
            </Button>
            <BackButton
                onClick={onBack}
                disabled={loading}
                label="Use a different number"
            />
        </form>
    );
}

function NameInputPanel({
    firstName,
    lastName,
    loading,
    onFirstNameChange,
    onLastNameChange,
    onSubmit,
}: {
    firstName: string;
    lastName: string;
    loading: boolean;
    onFirstNameChange: (v: string) => void;
    onLastNameChange: (v: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <Field label="First name">
                    <input
                        type="text"
                        autoFocus
                        autoComplete="given-name"
                        placeholder="Aarav"
                        value={firstName}
                        onChange={(e) => onFirstNameChange(e.target.value)}
                        className={inputClass}
                    />
                </Field>
                <Field label="Last name" hint="Optional">
                    <input
                        type="text"
                        autoComplete="family-name"
                        placeholder="Sharma"
                        value={lastName}
                        onChange={(e) => onLastNameChange(e.target.value)}
                        className={inputClass}
                    />
                </Field>
            </div>

            <Button
                type="submit"
                variant="exec-dark"
                disabled={loading}
                className="w-full h-11 cursor-pointer text-[13.5px] font-medium"
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                    </>
                ) : (
                    "Finish sign-up"
                )}
            </Button>
        </form>
    );
}

function CompletePanel() {
    return (
        <div className="flex flex-col items-center justify-center py-6">
            <motion.div
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 18,
                }}
                className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center",
                    "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
                )}
            >
                <Check className="h-6 w-6" strokeWidth={2.5} />
            </motion.div>
            <p className="mt-3 text-[13px] text-muted-foreground">
                Redirecting…
            </p>
        </div>
    );
}

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="flex items-baseline justify-between">
                <span className="text-[12.5px] font-medium text-foreground">
                    {label}
                </span>
                {hint && (
                    <span className="text-[11px] text-muted-foreground">
                        {hint}
                    </span>
                )}
            </span>
            <div className="mt-1">{children}</div>
        </label>
    );
}

function BackButton({
    onClick,
    disabled,
    label = "Back",
}: {
    onClick: () => void;
    disabled?: boolean;
    label?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "w-full h-9 inline-flex items-center justify-center gap-1.5",
                "text-[12.5px] text-muted-foreground hover:text-foreground",
                "cursor-pointer transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
        >
            <ChevronLeft className="h-3.5 w-3.5" />
            {label}
        </button>
    );
}

const inputClass = cn(
    "w-full h-10 rounded-lg border border-input bg-white",
    "px-3 text-[14px] placeholder:text-muted-foreground/60",
    "focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent",
    "transition-shadow",
);
