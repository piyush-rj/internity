"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import {
    PiCake,
    PiEnvelope,
    PiMapPin,
    PiPhone,
    PiUserCircle,
} from "react-icons/pi";
import { BasicsForm } from "@/src/components/profile-page/BasicsForm";
import { computeCompletion } from "@/src/components/profile-wizard/utils";
import type { StudentProfile } from "@/src/lib/api";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";
import { cn } from "@/src/lib/utils";
import Image from "next/image";

export function ProfileHeaderCard({
    profile,
    onSaved,
    editTrigger = 0,
}: {
    profile: StudentProfile | null;
    onSaved: () => Promise<void>;
    editTrigger?: number;
}) {
    const [editing, setEditing] = useState(!profile);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (editTrigger > 0) setEditing(true);
    }, [editTrigger]);
    const { pct } = computeCompletion(profile);
    const session = useUserSessionStore((s) => s.session);
    const email = session?.user?.email ?? null;

    const fullName = profile
        ? `${profile.firstName}${profile.lastName ? " " + profile.lastName : ""}`
        : "Add your name";

    return (
        <section
            id="profile-summary"
            className="rounded-xl border border-border bg-neutral-50 overflow-hidden scroll-mt-20"
        >
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 p-6">
                <Avatar pct={pct} />

                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-[22px] font-semibold tracking-tight truncate">
                            {fullName.toUpperCase()}
                        </h1>
                        {profile && (
                            <button
                                type="button"
                                onClick={() => setEditing((v) => !v)}
                                aria-label={
                                    editing ? "Close editor" : "Edit basics"
                                }
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
                        {profile?.city && (
                            <Fact icon={<PiMapPin />} text={profile.city} />
                        )}
                        {profile?.gender && (
                            <Fact
                                icon={<PiUserCircle />}
                                text={prettyGender(profile.gender)}
                            />
                        )}
                        {profile?.dob && (
                            <Fact
                                icon={<PiCake />}
                                text={formatDob(profile.dob)}
                            />
                        )}
                        {profile?.phone && (
                            <Fact icon={<PiPhone />} text={profile.phone} />
                        )}
                        {email && <Fact icon={<PiEnvelope />} text={email} />}
                    </dl>
                </div>
            </div>

            {(editing || !profile) && (
                <div className="border-t border-border bg-secondary/30 p-6">
                    <BasicsForm
                        profile={profile}
                        onSaved={onSaved}
                        onCancel={profile ? () => setEditing(false) : undefined}
                    />
                </div>
            )}
        </section>
    );
}

function Avatar({ pct }: { pct: number }) {
    const session = useUserSessionStore((s) => s.session);

    const ringStyle = {
        background: `conic-gradient(rgb(34 197 94) ${pct * 3.6}deg, rgb(229 231 235) 0deg)`,
    };
    return (
        <div className="relative h-28 w-28 shrink-0">
            <div
                className="absolute inset-0 rounded-full p-0.75"
                style={ringStyle}
            >
                <div className="h-full w-full rounded-full bg-card overflow-hidden flex items-center justify-center">
                    <span
                        className={cn(
                            "h-full w-full rounded-full flex items-center justify-center relative",
                            "overflow-hidden",
                            "text-white text-[34px] font-semibold",
                        )}
                    >
                        {session && session.user && session.user.image && (
                            <Image
                                src={session.user.image}
                                alt={session.user.name ?? "user"}
                                className="object-cover"
                                fill
                                unoptimized
                                loading="eager"
                            />
                        )}
                    </span>
                </div>
            </div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-card border border-border px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 tabular-nums">
                {pct}%
            </span>
        </div>
    );
}

function Fact({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-1.5 text-foreground min-w-0">
            <span className="text-muted-foreground inline-flex h-3.5 w-3.5 items-center justify-center">
                {icon}
            </span>
            <span className="truncate">{text}</span>
        </div>
    );
}

function prettyGender(g: NonNullable<StudentProfile["gender"]>): string {
    switch (g) {
        case "MALE":
            return "Male";
        case "FEMALE":
            return "Female";
        case "OTHER":
            return "Other";
        case "PREFER_NOT_TO_SAY":
            return "Prefer not to say";
    }
}

function formatDob(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return iso.slice(0, 10);
    }
}
