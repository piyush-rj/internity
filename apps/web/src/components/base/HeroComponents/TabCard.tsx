import { DashboardMock } from "@/src/components/base/HeroComponents/DashboardMock";

export function TabCard() {
    return (
        <div className="relative mx-auto max-w-6xl px-6 -mt-5">
            <div className="relative rounded-t-[28px] border border-b-0 border-border pt-14 pb-0 bg-neutral-200/50">
                <div className="relative px-4 sm:px-8">
                    <div className="relative">
                        <DashboardMock />
                    </div>
                </div>
            </div>
        </div>
    );
}
