"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight, Briefcase, Sparkles } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function FinalCTA() {
    const router = useRouter();

    return (
        <section className="relative">
            <div className="mx-auto max-w-6xl px-10 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-start">
                    {/* Left column */}
                    <div className="flex flex-col h-full">
                        <span
                            className={cn(
                                "inline-flex items-center gap-1.5 self-start",
                                "rounded-full bg-brand px-3 py-1",
                                "text-[12px] font-medium text-white",
                            )}
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Platform stats
                        </span>

                        <h2
                            className={cn(
                                "mt-5 text-[40px] sm:text-[48px]",
                                "leading-[1.05] tracking-[-0.025em] font-semibold",
                                "text-neutral-900",
                            )}
                        >
                            Proven by India&apos;s
                            <br />
                            top students.
                        </h2>

                        <p className="mt-5 text-[14.5px] text-neutral-600 leading-relaxed max-w-sm">
                            Land verified internships and graduate roles faster
                            with a profile built to get noticed.
                        </p>

                        <button
                            onClick={() => router.push("/home")}
                            className={cn(
                                "mt-5 inline-flex items-center gap-1 self-start",
                                "text-[13.5px] font-medium text-brand cursor-pointer",
                                "hover:underline underline-offset-4",
                            )}
                        >
                            Create your free profile
                            <ArrowUpRight className="h-4 w-4" />
                        </button>

                        <div className="mt-auto pt-10">
                            <p className="text-[13px] text-neutral-700 max-w-xs leading-relaxed">
                                <span className="font-semibold">
                                    Trusted by 200k+ students
                                </span>{" "}
                                applying, interviewing, and getting hired every
                                week.
                            </p>
                            <div className="mt-3 flex items-center gap-3">
                                <AvatarStack />
                                <span className="text-[12.5px] text-neutral-500">
                                    rated 4.8/5
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right column — stat cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard
                            label="Higher placements"
                            value="76%"
                            caption="Hired within 90 days of joining"
                            className="col-span-2"
                            big
                        />
                        <StatCard
                            label="Faster shortlists"
                            value="91%"
                            caption="Profiles reviewed in under 48 hours"
                        />
                        <StatCard
                            label="Verified startups"
                            value="69%"
                            caption="Roles from funded, vetted teams"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function StatCard({
    label,
    value,
    caption,
    className,
    big,
}: {
    label: string;
    value: string;
    caption: string;
    className?: string;
    big?: boolean;
}) {
    return (
        <div
            className={cn(
                "rounded-2xl bg-neutral-100/80 ring-1 ring-black/5",
                "p-5 sm:p-6 flex flex-col justify-between",
                big ? "min-h-[180px]" : "min-h-[220px]",
                className,
            )}
        >
            <div className="flex items-center gap-2 text-brand">
                <Briefcase className="h-4 w-4" />
                <span className="text-[13px] font-medium text-neutral-700">
                    {label}
                </span>
            </div>

            <div className="mt-auto">
                <div className="text-[44px] sm:text-[52px] leading-none tracking-[-0.03em] font-semibold text-neutral-900">
                    {value}
                </div>
                <div className="mt-3 text-[13px] text-neutral-600">
                    {caption}
                </div>
            </div>
        </div>
    );
}

const AVATAR_IMAGES = [
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=96&h=96&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=faces",
] as const;

function AvatarStack() {
    return (
        <div className="flex -space-x-2">
            {AVATAR_IMAGES.map((src, i) => (
                <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover ring-2 ring-white bg-neutral-200"
                    style={{ zIndex: AVATAR_IMAGES.length - i }}
                />
            ))}
        </div>
    );
}
