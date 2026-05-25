"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
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
import { uploadApi } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMeStore } from "@/src/store/useMeStore";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";
import { cn } from "@/src/lib/utils";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

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
    const me = useMeStore((s) => s.me);
    const email = me?.email ?? session?.user?.email ?? null;
    const phone = me?.phone ?? session?.user?.phone ?? null;

    const fullName = profile
        ? `${profile.firstName}${profile.lastName ? " " + profile.lastName : ""}`
        : (me?.name ?? "Add your name");

    return (
        <section
            id="profile-summary"
            className="rounded-xl border border-border bg-neutral-50 overflow-hidden scroll-mt-20"
        >
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 p-6">
                <Avatar pct={pct} displayName={fullName} />

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
                        {(profile?.phone || phone) && (
                            <Fact
                                icon={<PiPhone />}
                                text={(profile?.phone ?? phone) as string}
                            />
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

function Avatar({ pct, displayName }: { pct: number; displayName: string }) {
    const me = useMeStore((s) => s.me);
    const refetchMe = useMeStore((s) => s.refetch);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const image = me?.image ?? null;
    const initial = (displayName || "U").trim()[0]?.toUpperCase() ?? "U";

    async function handleFile(file: File) {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type as never)) {
            toast.error("Pick a JPG, PNG, or WebP image.");
            return;
        }
        if (file.size === 0) {
            toast.error("That file looks empty.");
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            toast.error("Image must be under 5 MB.");
            return;
        }

        setUploading(true);
        try {
            const { key, putUrl } = await uploadApi.sign({
                kind: "PROFILE_IMAGE",
                contentType: file.type,
                sizeBytes: file.size,
            });
            await putToPresignedUrl(putUrl, file);
            await uploadApi.confirm({
                kind: "PROFILE_IMAGE",
                key,
                contentType: file.type,
                sizeBytes: file.size,
            });
            await refetchMe();
            toast.success("Profile picture updated.");
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : "Could not upload picture.",
            );
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    const ringStyle = {
        background: `conic-gradient(rgb(34 197 94) ${pct * 3.6}deg, rgb(229 231 235) 0deg)`,
    };

    return (
        <div className="relative h-28 w-28 shrink-0 group">
            <div
                className="absolute inset-0 rounded-full p-0.75"
                style={ringStyle}
            >
                <div className="h-full w-full rounded-full bg-card overflow-hidden">
                    <span
                        className={cn(
                            "h-full w-full rounded-full flex items-center justify-center relative overflow-hidden",
                            "text-white text-[34px] font-semibold",
                            !image &&
                                "bg-linear-to-br from-pink-400 to-violet-500",
                        )}
                    >
                        {image ? (
                            <Image
                                src={image}
                                alt={displayName}
                                className="object-cover"
                                fill
                                unoptimized
                                loading="eager"
                            />
                        ) : (
                            <span>{initial}</span>
                        )}
                    </span>
                </div>
            </div>

            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label="Change profile picture"
                className={cn(
                    "absolute inset-0 rounded-full",
                    "flex items-center justify-center",
                    "bg-black/40 text-white",
                    "opacity-0 group-hover:opacity-100",
                    uploading && "opacity-100",
                    "transition-opacity duration-150",
                    "cursor-pointer disabled:cursor-wait",
                    "focus:outline-none focus:opacity-100",
                )}
            >
                {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <Pencil className="h-4.5 w-4.5" />
                )}
            </button>

            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                className="sr-only"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                }}
            />

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

// direct put to s3-compatible presigned url
function putToPresignedUrl(url: string, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed (${xhr.status})`));
        });
        xhr.addEventListener("error", () =>
            reject(new Error("Network error while uploading.")),
        );
        xhr.addEventListener("abort", () =>
            reject(new Error("Upload cancelled.")),
        );
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
    });
}
