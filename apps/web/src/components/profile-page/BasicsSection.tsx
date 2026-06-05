"use client";

import { SectionCard } from "@/src/components/profile-page/SectionCard";
import { BasicsForm } from "@/src/components/profile-page/BasicsForm";
import type { StudentProfile } from "@/src/lib/api";

export function BasicsSection({
    profile,
    onSaved,
}: {
    profile: StudentProfile | null;
    onSaved: () => Promise<void>;
}) {
    return (
        <SectionCard
            id="profile-basics"
            title="Basics"
            tooltip="Essential contact details: phone number, date of birth, gender, city, LinkedIn, and portfolio URL."
        >
            <BasicsForm profile={profile} onSaved={onSaved} />
        </SectionCard>
    );
}
