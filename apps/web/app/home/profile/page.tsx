"use client";
import { useCallback, useState } from "react";
import { BasicsSection } from "@/src/components/profile-page/BasicsSection";
import { CertificationsSection } from "@/src/components/profile-page/CertificationsSection";
import { EducationSection } from "@/src/components/profile-page/EducationSection";
import { EmployerProfileEditor } from "@/src/components/profile-page/EmployerProfileEditor";
import { ExperienceSection } from "@/src/components/profile-page/ExperienceSection";
import { LanguagesSection } from "@/src/components/profile-page/LanguagesSection";
import { ProfileHeaderCard } from "@/src/components/profile-page/ProfileHeaderCard";
import { ProjectsSection } from "@/src/components/profile-page/ProjectsSection";
import { SkillsSection } from "@/src/components/profile-page/SkillsSection";
import { ProfileFormSidebar } from "@/src/components/profile-wizard/ProfileFormSidebar";
import type { StepKey } from "@/src/components/profile-wizard/utils";
import { useMyProfile } from "@/src/hooks/useMyProfile";
import { useMeStore } from "@/src/store/useMeStore";

export default function ProfilePage() {
    const role = useMeStore((s) => s.me?.role);
    if (role === "EMPLOYER") return <EmployerProfileEditor />;

    return <StudentProfile />;
}

function StudentProfile() {
    const { profile, loading, refetch } = useMyProfile();
    const refetchMe = useMeStore((s) => s.refetch);
    const [currentStep, setCurrentStep] = useState<StepKey>("summary");

    // Refresh both the student profile AND the global `me` row on every save.
    // `me` carries interestedJobTitles + completion flags that drive the
    // dashboard and the "Recommended internships" feed — without this they'd
    // stay stale until a full page reload.
    const handleSaved = useCallback(async () => {
        await Promise.all([refetch(), refetchMe()]);
    }, [refetch, refetchMe]);

    function handleStepClick(step: StepKey) {
        setCurrentStep(step);
        if (step === "summary") {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        // "basics" now has its own section card below the header
        const id = step === "basics" ? "profile-basics" : `profile-${step}`;
        document
            .getElementById(id)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return (
        <div className="flex min-h-[calc(100vh-3.25rem)] -mt-px">
            <ProfileFormSidebar
                currentStep={currentStep}
                onStepClick={handleStepClick}
                profile={profile}
            />

            <main className="flex-1 min-w-0">
                <div className="mx-auto max-w-4xl px-6 py-8 sm:px-10 space-y-4">
                    {loading && !profile ? (
                        <LoadingShell />
                    ) : (
                        <>
                            {/* Summary: pure display — avatar, name, key facts */}
                            <ProfileHeaderCard profile={profile} />

                            {/* Basics: editable section card */}
                            <BasicsSection
                                profile={profile}
                                onSaved={handleSaved}
                            />

                            <EducationSection
                                profile={profile}
                                onSaved={handleSaved}
                            />
                            <SkillsSection
                                profile={profile}
                                onSaved={handleSaved}
                            />
                            <ProjectsSection
                                profile={profile}
                                onSaved={handleSaved}
                            />
                            <LanguagesSection
                                profile={profile}
                                onSaved={handleSaved}
                            />
                            {/* Optional sections last — they don't count
                                toward profile completion. */}
                            <ExperienceSection
                                profile={profile}
                                onSaved={handleSaved}
                            />
                            <CertificationsSection
                                profile={profile}
                                onSaved={handleSaved}
                            />
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

function LoadingShell() {
    return (
        <div className="animate-pulse space-y-3">
            <div className="h-32 w-full rounded-lg bg-muted" />
            <div className="h-32 w-full rounded-lg bg-muted" />
            <div className="h-24 w-full rounded-lg bg-muted" />
        </div>
    );
}
