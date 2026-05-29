"use client";

import Link from "next/link";
import { ArrowRight, MessagesSquare } from "lucide-react";
import { NavBar } from "@/src/components/navbar/NavBar";
import { Footer } from "@/src/components/base/Footer";

// Role categories we plan to curate interview questions for. Shown as a
// preview while the question library is being built.
const CATEGORIES = [
    "Frontend Development",
    "Backend Development",
    "Full-Stack",
    "Data & Analytics",
    "Product Management",
    "UI / UX Design",
    "Marketing",
    "Sales / BD",
    "HR / People Ops",
    "Content & Writing",
];

export default function InterviewQuestionsPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-1 pt-14">
                <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1 text-[12px] font-medium">
                        <MessagesSquare className="h-3.5 w-3.5" />
                        Interview prep
                    </span>
                    <h1 className="mt-4 text-[30px] sm:text-[38px] font-semibold tracking-tight leading-tight">
                        Interview Questions
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                        We&apos;re putting together a library of role-wise
                        interview questions to help students and fresh graduates
                        walk into every interview prepared and confident.
                        Organized by role, focused on the questions employers
                        actually ask.
                    </p>

                    <div className="mt-8 flex flex-wrap justify-center gap-2">
                        {CATEGORIES.map((c) => (
                            <span
                                key={c}
                                className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] text-foreground/80"
                            >
                                {c}
                            </span>
                        ))}
                    </div>

                    <p className="mt-8 text-[13px] text-muted-foreground">
                        Curated question sets are on the way — check back soon.
                    </p>

                    <div className="mt-8">
                        <Link
                            href="/home/internships"
                            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-neutral-900 text-white text-[14px] font-medium hover:bg-neutral-800 transition-colors"
                        >
                            Browse internships
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
