import { Applications } from "@/src/components/dashboard/Applications";
import { Greeting } from "@/src/components/dashboard/Greeting";
import { OngoingTrainings } from "@/src/components/dashboard/OngoingTrainings";
import { ProfileCompletion } from "@/src/components/dashboard/ProfileCompletion";
import { RecommendedInternships } from "@/src/components/dashboard/RecommendedInternships";
import { StatsRow } from "@/src/components/dashboard/StatsRow";

export default function DashboardPage() {
    return (
        <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
            <Greeting />
            <StatsRow />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    <RecommendedInternships />
                    <Applications />
                </div>
                <div className="space-y-4">
                    <ProfileCompletion />
                    <OngoingTrainings />
                </div>
            </div>
        </div>
    );
}
