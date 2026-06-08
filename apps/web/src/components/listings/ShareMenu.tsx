"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Share2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

type ShareDetails = {
    mode: string;
    city: string | null;
    durationMonths: number | null;
    durationWeeks: number | null;
    stipendMin: number | null;
    stipendMax: number | null;
    currency: string | null;
    skillTagsRaw: string[];
};

function buildLocation(mode: string, city: string | null): string {
    if (mode === "REMOTE") return "Remote";
    if (mode === "HYBRID") return city ? `${city} (Hybrid)` : "Hybrid";
    return city ?? "On-site";
}

function buildDuration(months: number | null, weeks: number | null): string | null {
    if (months) return `${months} Month${months !== 1 ? "s" : ""}`;
    if (weeks) return `${weeks} Week${weeks !== 1 ? "s" : ""}`;
    return null;
}

function buildStipend(
    min: number | null,
    max: number | null,
    currency: string | null,
): string | null {
    if (!min) return null;
    const symbol = currency === "INR" ? "₹" : (currency ?? "");
    if (max && max !== min) return `${symbol}${min.toLocaleString("en-IN")}-${max.toLocaleString("en-IN")}/month`;
    return `${symbol}${min.toLocaleString("en-IN")}/month`;
}

function buildShareMessage(title: string, details: ShareDetails, fullUrl: string): string {
    const location = buildLocation(details.mode, details.city);
    const duration = buildDuration(details.durationMonths, details.durationWeeks);
    const stipend = buildStipend(details.stipendMin, details.stipendMax, details.currency);
    const skills = details.skillTagsRaw.join(", ");

    return [
        `🚀 Role: ${title}`,
        `📍 Location: ${location}`,
        duration ? `⏳ Duration: ${duration}` : null,
        stipend ? `💰 Stipend: ${stipend}` : null,
        `🎓 Eligibility: Students & Fresh Graduates`,
        skills ? `🛠 Skills: ${skills}` : null,
        ``,
        `Apply here:`,
        fullUrl,
    ].filter((l) => l !== null).join("\n");
}

// Share menu for a listing — copy link + intents to WhatsApp / LinkedIn /
// X (Twitter). Triggered by a button that shows a popover with options.
export function ShareMenu({
    url,
    title,
    company,
    onlyLogo = false,
    listing,
}: {
    url: string;
    title: string;
    company: string;
    onlyLogo?: boolean;
    listing?: ShareDetails;
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

    const fullUrl =
        typeof window !== "undefined" && url.startsWith("/")
            ? `${window.location.origin}${url}`
            : url;

    const shareMessage = listing
        ? buildShareMessage(title, listing, fullUrl)
        : `${title} at ${company}\n\nApply here:\n${fullUrl}`;

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

    function shareWhatsapp() {
        const message = `
Role: Backend Developer Internship
Location: Remote
Duration: 3 Months
Stipend: ₹10,000/month
Eligibility: Students & Fresh Graduates
Skills: Node.js, Express.js, MongoDB

Apply here:
https://www.spiderskill.com/home/listings/cmq3htcoj0005hmvh66tg1xzm
`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, "_blank");
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
                    <button
                        type="button"
                        onClick={shareWhatsapp}
                        className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm text-[12.5px] hover:bg-accent cursor-pointer"
                    >
                        <span className="h-3.5 w-3.5 inline-flex items-center justify-center text-emerald-600 font-bold text-[14px]">
                            W
                        </span>
                        Share on WhatsApp
                    </button>
                    <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                            void navigator.clipboard.writeText(shareMessage).catch(() => { });
                            toast.success("Post text copied — paste it into your LinkedIn post");
                            setOpen(false);
                        }}
                        className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm text-[12.5px] hover:bg-accent cursor-pointer"
                    >
                        <span className="h-3.5 w-3.5 inline-flex items-center justify-center text-sky-700 font-bold text-[12px]">
                            in
                        </span>
                        Share on LinkedIn
                    </a>
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`}
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
