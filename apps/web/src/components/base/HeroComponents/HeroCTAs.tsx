"use client";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function HeroCTAs() {
    const router = useRouter();

    return (
        <div className="mt-9 flex items-center justify-center gap-2.5">
            <Button
                onClick={() => router.push("/home")}
                variant={"exec-dark"}
                className={cn(
                    "group inline-flex items-center gap-2 rounded-lg",
                    "text-white px-4 h-10 text-[14px] font-medium cursor-pointer group",
                )}
            >
                Start hunting
            </Button>

            <Button
                onClick={() => router.push("/home")}
                variant={"exec-light"}
                className={cn(
                    "group inline-flex items-center gap-2 rounded-lg",
                    "px-4 h-10 text-[14px] font-medium cursor-pointer",
                )}
            >
                Go to Profile
            </Button>
        </div>
    );
}
