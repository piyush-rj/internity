"use client";

import Image from "next/image";
import { cn } from "@/src/lib/utils";

// chat avatar with sm and lg sizes, falls back to gradient initial
export function ChatAvatar({
    name,
    image,
    size,
    contain,
}: {
    name: string | null;
    image: string | null;
    size: "sm" | "lg";
    contain?: boolean;
}) {
    const sizeCls =
        size === "lg" ? "h-16 w-16 text-[20px]" : "h-9 w-9 text-[12px]";
    const initial = (name ?? "U")[0]?.toUpperCase() ?? "U";
    return (
        <span
            className={cn(
                "relative rounded-full overflow-hidden shrink-0 ring-1 ring-border",
                contain && "bg-white",
                sizeCls,
            )}
        >
            {image ? (
                <Image
                    src={image}
                    alt={name ?? "user"}
                    fill
                    unoptimized
                    className={
                        contain
                            ? "object-contain object-[center_58%]"
                            : "object-cover"
                    }
                />
            ) : (
                <span className="flex h-full w-full items-center justify-center bg-linear-to-br from-pink-400 to-violet-500 text-white font-semibold">
                    {initial}
                </span>
            )}
        </span>
    );
}
