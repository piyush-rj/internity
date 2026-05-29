"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    PiArrowSquareOut,
    PiCake,
    PiEnvelope,
    PiFilePdf,
    PiGlobe,
    PiLinkedinLogoFill,
    PiMapPin,
    PiPhone,
    PiSealCheckFill,
    PiUserCircle,
} from "react-icons/pi";
import { NavBar } from "@/src/components/navbar/NavBar";
import { studentApi, type PublicStudentProfile } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { cn } from "@/src/lib/utils";

export default function PublicStudentPage({
    params,
}: {
    params: Promise<{ userId: string }>;
}) {
    const { userId } = use(params);
    const [profile, setProfile] = useState<PublicStudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiClientError | Error | null>(null);

    useEffect(() => {
        let cancelled = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);

        setError(null);
        studentApi
            .get_public(userId)
            .then(({ profile }) => {
                if (!cancelled) setProfile(profile);
            })
            .catch((err) => {
                if (!cancelled)
                    setError(
                        err instanceof Error ? err : new Error(String(err)),
                    );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [userId]);

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-1 pt-14">
                <div className="mx-auto max-w-4xl px-6 py-10">
                    {loading ? (
                        <PageSkeleton />
                    ) : error || !profile ? (
                        <NotFound message={error?.message ?? null} />
                    ) : (
                        <ProfileView profile={profile} />
                    )}
                </div>
            </main>
        </div>
    );
}

function ProfileView({ profile }: { profile: PublicStudentProfile }) {
    const fullName =
        `${profile.firstName ?? ""}${profile.lastName ? " " + profile.lastName : ""}`.trim() ||
        profile.user.name;

    return (
        <div className="space-y-6">
            <Hero profile={profile} name={fullName} />

            {profile.resumeUrl && (
                <Section title="Resume">
                    <a
                        href={profile.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                            "inline-flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2",
                            "text-[13px] font-medium text-foreground hover:bg-secondary transition-colors",
                        )}
                    >
                        <PiFilePdf className="h-4 w-4 text-rose-600" />
                        View resume
                        <PiArrowSquareOut className="h-3 w-3 text-muted-foreground" />
                    </a>
                </Section>
            )}

            {profile.bio && (
                <Section title="About">
                    <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">
                        {profile.bio}
                    </p>
                </Section>
            )}

            {profile.educations.length > 0 && (
                <Section title="Education">
                    <ul className="space-y-3">
                        {profile.educations.map((e) => (
                            <li key={e.id}>
                                <div className="text-[13.5px] font-medium">
                                    {e.degree}
                                    {e.fieldOfStudy
                                        ? ` · ${e.fieldOfStudy}`
                                        : ""}
                                </div>
                                <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                                    {e.institute}
                                </div>
                                <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                                    {e.startYear} –{" "}
                                    {e.current ? "Present" : (e.endYear ?? "—")}
                                    {e.grade ? ` · ${e.grade}` : ""}
                                </div>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {profile.experiences.length > 0 && (
                <Section title="Experience">
                    <ul className="space-y-3">
                        {profile.experiences.map((x) => (
                            <li key={x.id}>
                                <div className="text-[13.5px] font-medium">
                                    {x.title}
                                </div>
                                <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                                    {x.company}
                                    {x.location ? ` · ${x.location}` : ""}
                                </div>
                                <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                                    {formatDate(x.startDate)} –{" "}
                                    {x.current
                                        ? "Present"
                                        : x.endDate
                                          ? formatDate(x.endDate)
                                          : "—"}
                                </div>
                                {x.description && (
                                    <p className="mt-1.5 text-[13px] text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                        {x.description}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {profile.projects.length > 0 && (
                <Section title="Projects">
                    <ul className="space-y-3">
                        {profile.projects.map((p) => (
                            <li key={p.id}>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[13.5px] font-medium">
                                        {p.title}
                                    </span>
                                    {p.link && (
                                        <a
                                            href={p.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand hover:underline"
                                        >
                                            Link
                                            <PiArrowSquareOut className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                                {p.description && (
                                    <p className="mt-1 text-[13px] text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                        {p.description}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {profile.skills.length > 0 && (
                <Section title="Skills">
                    <div className="flex flex-wrap gap-1.5">
                        {profile.skills.map((s) => (
                            <span
                                key={s.skill.id}
                                className="inline-flex items-center h-7 px-2.5 rounded-lg border border-border bg-secondary/40 text-[12.5px]"
                            >
                                {s.skill.name}
                            </span>
                        ))}
                    </div>
                </Section>
            )}

            {profile.certifications.length > 0 && (
                <Section title="Certifications">
                    <ul className="space-y-2">
                        {profile.certifications.map((c) => (
                            <li key={c.id} className="text-[13.5px]">
                                <span className="font-medium">{c.name}</span>
                                {c.issuer && (
                                    <span className="text-muted-foreground">
                                        {" "}
                                        · {c.issuer}
                                    </span>
                                )}
                                {c.credentialUrl && (
                                    <>
                                        {" · "}
                                        <a
                                            href={c.credentialUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
                                        >
                                            View
                                            <PiArrowSquareOut className="h-3 w-3" />
                                        </a>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {profile.languages.length > 0 && (
                <Section title="Languages">
                    <div className="flex flex-wrap gap-1.5">
                        {profile.languages.map((l) => (
                            <span
                                key={l.id}
                                className="inline-flex items-center h-7 px-2.5 rounded-lg border border-border bg-secondary/40 text-[12.5px]"
                            >
                                {l.name}
                                {l.proficiency ? ` · ${l.proficiency}/5` : ""}
                            </span>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
}

function Hero({
    profile,
    name,
}: {
    profile: PublicStudentProfile;
    name: string;
}) {
    return (
        <section className="rounded-lg border border-border bg-card p-6 sm:p-8">
            <div className="flex items-start gap-5">
                <Avatar name={name} image={profile.user.image ?? null} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-[26px] font-semibold tracking-tight truncate">
                            {name}
                        </h1>
                        {profile.isVerified && (
                            <span
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700"
                                title="Verified by SpiderSkill admins"
                                aria-label="Verified student"
                            >
                                <PiSealCheckFill className="h-3.5 w-3.5" />
                                Verified
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                        {profile.user.email}
                    </p>
                    <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12.5px]">
                        {profile.city && (
                            <Fact
                                icon={<PiMapPin className="h-3.5 w-3.5" />}
                                text={profile.city}
                            />
                        )}
                        {profile.phone && (
                            <Fact
                                icon={<PiPhone className="h-3.5 w-3.5" />}
                                text={profile.phone}
                            />
                        )}
                        {profile.gender && (
                            <Fact
                                icon={<PiUserCircle className="h-3.5 w-3.5" />}
                                text={prettyGender(profile.gender)}
                            />
                        )}
                        {profile.dob && (
                            <Fact
                                icon={<PiCake className="h-3.5 w-3.5" />}
                                text={formatDate(profile.dob)}
                            />
                        )}
                        <Fact
                            icon={<PiEnvelope className="h-3.5 w-3.5" />}
                            text={profile.user.email}
                        />
                        {profile.linkedinUrl && (
                            <Fact
                                icon={
                                    <PiLinkedinLogoFill className="h-3.5 w-3.5" />
                                }
                                text={
                                    <a
                                        href={profile.linkedinUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-brand hover:underline truncate"
                                    >
                                        LinkedIn
                                    </a>
                                }
                            />
                        )}
                        {profile.portfolioUrl && (
                            <Fact
                                icon={<PiGlobe className="h-3.5 w-3.5" />}
                                text={
                                    <a
                                        href={profile.portfolioUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-brand hover:underline truncate"
                                    >
                                        Portfolio
                                    </a>
                                }
                            />
                        )}
                    </dl>
                </div>
            </div>
        </section>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-[14px] font-semibold tracking-tight mb-3">
                {title}
            </h2>
            {children}
        </section>
    );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
    if (image) {
        return (
            <span className="relative h-20 w-20 rounded-full overflow-hidden ring-1 ring-border shrink-0">
                <Image
                    src={image}
                    alt={name}
                    fill
                    unoptimized
                    className="object-cover"
                />
            </span>
        );
    }
    return (
        <span
            className={cn(
                "h-20 w-20 rounded-full flex items-center justify-center shrink-0",
                "bg-linear-to-br from-pink-400 to-violet-500",
                "text-white text-[28px] font-semibold ring-1 ring-border",
            )}
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function Fact({
    icon,
    text,
}: {
    icon: React.ReactNode;
    text: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-1.5 text-foreground min-w-0">
            <span className="text-muted-foreground inline-flex h-3.5 w-3.5 items-center justify-center">
                {icon}
            </span>
            <span className="truncate">{text}</span>
        </div>
    );
}

function PageSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="rounded-lg border border-border bg-card p-8">
                <div className="flex items-start gap-5">
                    <div className="h-20 w-20 rounded-full bg-secondary shrink-0" />
                    <div className="flex-1 space-y-3">
                        <div className="h-6 w-1/2 rounded-md bg-secondary" />
                        <div className="h-3 w-1/3 rounded-md bg-secondary" />
                    </div>
                </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6 h-32" />
            <div className="rounded-lg border border-border bg-card p-6 h-32" />
        </div>
    );
}

function NotFound({ message }: { message: string | null }) {
    return (
        <div className="rounded-lg border border-border bg-card px-6 py-16 text-center">
            <h1 className="text-[20px] font-semibold">Profile not found</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
                {message ??
                    "This profile may be private or the link is incorrect."}
            </p>
            <Link
                href="/"
                className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline"
            >
                Back to home
            </Link>
        </div>
    );
}

function prettyGender(g: NonNullable<PublicStudentProfile["gender"]>): string {
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

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return iso.slice(0, 10);
    }
}
