"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Info,
  MapPin,
  Phone,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { studentApi, type Gender } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  dob: string;
  gender: Gender | "";
  bio: string;
};

const empty: FormState = {
  firstName: "",
  lastName: "",
  phone: "",
  city: "",
  dob: "",
  gender: "",
  bio: "",
};

export default function NewProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await studentApi.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        city: form.city.trim() || undefined,
        dob: form.dob ? new Date(form.dob).toISOString() : undefined,
        gender: form.gender || undefined,
        bio: form.bio.trim() || undefined,
      });
      router.push("/dashboard");
    } catch (err) {
      setSubmitError(
        err instanceof ApiClientError
          ? err.message
          : "Couldn’t save your profile. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const completed = countCompleted(form);
  const total = 7;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </button>

      {/* Header */}
      <header className="mt-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-brand/15 text-brand">
            <User className="h-3.5 w-3.5" />
          </span>
          <span className="text-[13px] font-medium text-foreground">
            Create your profile
          </span>
        </div>
        <h1 className="text-[32px] sm:text-[36px] font-semibold tracking-[-0.02em] leading-[1.1]">
          Tell us a bit about yourself
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground max-w-xl leading-relaxed">
          Recruiters see your profile when you apply. Only your first name is
          required — you can fill the rest later.
        </p>

        {/* Progress hint */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {completed} of {total}
          </span>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <Section title="Basics">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="First name"
              required
              error={errors.firstName}
              icon={<User className="h-3.5 w-3.5" />}
            >
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="Piyush"
                autoComplete="given-name"
                autoFocus
                className={inputCls(!!errors.firstName)}
              />
            </Field>
            <Field label="Last name" icon={<User className="h-3.5 w-3.5" />}>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="Sharma"
                autoComplete="family-name"
                className={inputCls(false)}
              />
            </Field>
          </div>
        </Section>

        <Divider />

        <Section title="Contact">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone" icon={<Phone className="h-3.5 w-3.5" />}>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 98765 43210"
                autoComplete="tel"
                className={inputCls(false)}
              />
            </Field>
            <Field label="City" icon={<MapPin className="h-3.5 w-3.5" />}>
              <input
                type="text"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Bengaluru"
                autoComplete="address-level2"
                className={inputCls(false)}
              />
            </Field>
          </div>
        </Section>

        <Divider />

        <Section title="About you">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Date of birth"
              icon={<Calendar className="h-3.5 w-3.5" />}
            >
              <input
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
                className={inputCls(false)}
              />
            </Field>
            <Field label="Gender" icon={<Users className="h-3.5 w-3.5" />}>
              <select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value as Gender | "")}
                className={cn(inputCls(false), "pr-8 appearance-none")}
              >
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </Field>
          </div>

          <Field
            label="Short bio"
            hint="A line or two recruiters see at the top of your profile."
            icon={<Info className="h-3.5 w-3.5" />}
          >
            <textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="CS undergrad at IIT Delhi, building things on weekends."
              rows={3}
              maxLength={240}
              className={cn(inputCls(false), "min-h-24 resize-y")}
            />
            <div className="mt-1 text-right text-[11px] text-muted-foreground tabular-nums">
              {form.bio.length}/240
            </div>
          </Field>
        </Section>

        {submitError && (
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
          <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            You can edit any of this later.
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="exec-light"
              onClick={() => router.push("/dashboard")}
              disabled={submitting}
              className="h-10 px-4 text-[13px] cursor-pointer"
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              variant="exec-dark"
              disabled={submitting}
              className="h-10 px-4 text-[13px] cursor-pointer"
            >
              {submitting ? "Saving…" : "Save profile"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ---------------------------- helpers ---------------------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 py-1">
      <h2 className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Divider() {
  return <div className="my-7 h-px bg-border" />;
}

function Field({
  label,
  hint,
  required,
  error,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 mb-1.5 text-[12.5px] font-medium text-foreground">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {label}
        {required && <span className="text-destructive">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11.5px] text-destructive">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-[11.5px] text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function inputCls(invalid: boolean) {
  return cn(
    "w-full h-10 rounded-lg border bg-background px-3",
    "text-[14px] text-foreground placeholder:text-muted-foreground/70",
    "transition-colors outline-none",
    "focus:border-foreground/40 focus:ring-3 focus:ring-foreground/5",
    invalid ? "border-destructive/60" : "border-border",
  );
}

function countCompleted(f: FormState): number {
  return [
    f.firstName,
    f.lastName,
    f.phone,
    f.city,
    f.dob,
    f.gender,
    f.bio,
  ].filter((v) => v.trim().length > 0).length;
}
