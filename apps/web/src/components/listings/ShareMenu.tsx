"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Share2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

// Share menu for a listing — copy link + intents to WhatsApp / LinkedIn /
// X (Twitter). Triggered by a button that shows a popover with options.
export function ShareMenu({
    url,
    title,
    company,
    onlyLogo = false,
}: {
    url: string;
    title: string;
    company: string;
    onlyLogo?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        function onDoc(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    const shareText = `${title} at ${company}`;
    const fullUrl =
        typeof window !== "undefined" && url.startsWith("/")
            ? `${window.location.origin}${url}`
            : url;

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            toast.success("Link copied");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy. Long-press the link to copy.");
        }
    }

    return (
        <div ref={ref} className="relative inline-block">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label="Share this listing"
                className={cn(
                    "inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-background",
                    "text-[12.5px] font-medium hover:bg-secondary cursor-pointer",
                )}
            >
                <Share2 className="h-3.5 w-3.5" />
                {!onlyLogo && "Share"}
            </button>
            {open && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 z-30 w-56 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-popover shadow-lg p-1">
                    <button
                        type="button"
                        onClick={copyLink}
                        className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm text-[12.5px] hover:bg-accent cursor-pointer"
                    >
                        {copied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                            <Copy className="h-3.5 w-3.5" />
                        )}
                        Copy link
                    </button>
                    <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                            `${shareText}\n${fullUrl}`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                        className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm text-[12.5px] hover:bg-accent cursor-pointer"
                    >
                        <span className="h-3.5 w-3.5 inline-flex items-center justify-center text-emerald-600 font-bold text-[14px]">
                            W
                        </span>
                        Share on WhatsApp
                    </a>
                    <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                        className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm text-[12.5px] hover:bg-accent cursor-pointer"
                    >
                        <span className="h-3.5 w-3.5 inline-flex items-center justify-center text-sky-700 font-bold text-[12px]">
                            in
                        </span>
                        Share on LinkedIn
                    </a>
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                            shareText,
                        )}&url=${encodeURIComponent(fullUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                        className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm text-[12.5px] hover:bg-accent cursor-pointer"
                    >
                        <span className="h-3.5 w-3.5 inline-flex items-center justify-center font-bold text-[13px]">
                            X
                        </span>
                        Share on X
                    </a>
                </div>
            )}
        </div>
    );
}
