"use client";
import { SectionFrame } from "@/src/components/base/SectionFrame";
import { SectionHeader } from "@/src/components/base/SectionHeader";
import { cn } from "@/src/lib/utils";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { LiaSuitcaseSolid } from "react-icons/lia";
import { UserIcon } from "../dashboard/icons";

export function FinalCTA() {
    const router = useRouter();

    return (
        <section>
            <SectionFrame className="px-6 py-28 text-center">
                <SectionHeader
                    title={
                        <>
                            Start applying today.
                            <br />
                            Start earning tomorrow.
                        </>
                    }
                    align="center"
                />
                <div className="-mt-4 flex items-center justify-center gap-3">
                    <Button
                        onClick={() => router.push("/home")}
                        variant={"exec-dark"}
                        className={cn("h-10 px-3.5! cursor-pointer")}
                    >
                        <UserIcon className="h-3.5 w-3.5 text-white!" />
                        Create free profile
                    </Button>
                    <Button
                        onClick={() => router.push("/home")}
                        variant={"exec-light"}
                        className={cn("h-10 px-3.5! cursor-pointer")}
                    >
                        <LiaSuitcaseSolid className="h-3.5 w-3.5 text-black!" />
                        Post an internship
                    </Button>
                </div>
            </SectionFrame>
        </section>
    );
}
