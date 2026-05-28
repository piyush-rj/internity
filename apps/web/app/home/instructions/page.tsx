"use client";

import { InstructionsLayout } from "@/src/components/instructions/InstructionsLayout";
import {
    EMPLOYER_INSTRUCTIONS,
    STUDENT_INSTRUCTIONS,
} from "@/src/lib/catalog/instructions";
import { useMeStore } from "@/src/store/useMeStore";

export default function InstructionsPage() {
    const role = useMeStore((s) => s.me?.role);
    const initialized = useMeStore((s) => s.initialized);

    if (!initialized) return <Skeleton />;

    const isEmployer = role === "EMPLOYER";
    return (
        <InstructionsLayout
            heading={
                isEmployer
                    ? "Instructions for founders"
                    : "Instructions for students"
            }
            intro={
                isEmployer
                    ? "How to get the most out of SpiderSkill as a founder or hiring manager. Read once, refer back any time."
                    : "How to get the most out of SpiderSkill as a student. Read once, refer back any time."
            }
            sections={
                isEmployer ? EMPLOYER_INSTRUCTIONS : STUDENT_INSTRUCTIONS
            }
        />
    );
}

function Skeleton() {
    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 animate-pulse">
            <div className="h-7 w-72 rounded-md bg-secondary" />
            <div className="mt-2 h-4 w-96 rounded-md bg-secondary" />
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-10">
                <div className="space-y-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className="h-5 w-56 rounded-md bg-secondary" />
                            <div className="h-3 w-full rounded-md bg-secondary" />
                            <div className="h-3 w-4/5 rounded-md bg-secondary" />
                        </div>
                    ))}
                </div>
                <div className="hidden lg:block">
                    <div className="h-3 w-24 rounded-md bg-secondary mb-3" />
                    <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-3 w-32 rounded-md bg-secondary"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
