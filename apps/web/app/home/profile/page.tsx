"use client";
import { useState } from "react";
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
    const [currentStep, setCurrentStep] = useState<StepKey>("summary");
    const [basicsEditTrigger, setBasicsEditTrigger] = useState<number>(0);

    function handleStepClick(step: StepKey) {
        setCurrentStep(step);
        if (step === "summary") {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        if (step === "basics") {
            setBasicsEditTrigger((n) => n + 1);
            document
                .getElementById("profile-summary")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }
        document
            .getElementById(`profile-${step}`)
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
                            <ProfileHeaderCard
                                profile={profile}
                                onSaved={refetch}
                                editTrigger={basicsEditTrigger}
                            />
                            <EducationSection
                                profile={profile}
                                onSaved={refetch}
                            />
                            <SkillsSection
                                profile={profile}
                                onSaved={refetch}
                            />
                            <ExperienceSection
                                profile={profile}
                                onSaved={refetch}
                            />
                            <ProjectsSection
                                profile={profile}
                                onSaved={refetch}
                            />
                            <CertificationsSection
                                profile={profile}
                                onSaved={refetch}
                            />
                            <LanguagesSection
                                profile={profile}
                                onSaved={refetch}
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
