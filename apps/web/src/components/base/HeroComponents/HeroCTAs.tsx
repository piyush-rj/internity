"use client";
import { Button } from "@/src/components/ui/button";
import { ChevronRight } from "@/src/components/base/HeroComponents/glyphs";
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
                    "text-white pl-5 pr-3.5 h-10 text-[14px] font-medium cursor-pointer group",
                )}
            >
                Start hunting
                <ChevronRight className="h-3.5 w-3.5 text-white/55 group-hover:text-white/80 transition-all transform duration-200 group-hover:translate-x-0.5 " />
            </Button>

            <Button
                onClick={() => router.push("/home")}
                variant={"exec-light"}
                className={cn(
                    "group inline-flex items-center gap-2 rounded-lg",
                    "pl-5 pr-3.5 h-10 text-[14px] font-medium cursor-pointer",
                )}
            >
                Go to Profile
                <ChevronRight className="h-3.5 w-3.5 text-white/55 group-hover:text-white/80 transition-all transform duration-200 group-hover:translate-x-0.5 " />
            </Button>
        </div>
    );
}
