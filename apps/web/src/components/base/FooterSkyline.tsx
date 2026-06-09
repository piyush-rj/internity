import { cn } from "@/src/lib/utils";

// Decorative orange line-art cityscape shown at the bottom-right of the footer.
// Purely ornamental (aria-hidden). Approximation of the reference art — swap in
// a precise asset later by replacing this SVG if needed.
export function FooterSkyline({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 600 130"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("text-orange-300", className)}
        >
            {/* clouds */}
            <path d="M120 26c4-7 16-7 19 0 7-2 13 3 11 9H113c-3-6 1-10 7-9Z" />
            <path d="M470 20c3-6 13-6 16 0 6-2 11 2 9 8h-33c-2-5 2-8 8-8Z" />
            {/* hot-air balloon */}
            <circle cx="78" cy="44" r="15" />
            <path d="M78 29c-7 6-7 23 0 30M78 29c7 6 7 23 0 30M64 47h28" />
            <path d="M73 59h10l-2 7h-6l-2-7Z" />
            {/* ground line */}
            <path d="M20 120h560" />
            {/* left building cluster */}
            <path d="M40 120V86h26v34M46 92h14M46 100h14M46 108h14" />
            <path d="M70 120V74h20v46M75 80h10M75 90h10M75 100h10" />
            {/* domed monument (center-left) */}
            <path d="M150 120V96h44v24M172 96c0-12 0-20 0-20m0 0c-7 0-10 6-10 12m10-12c7 0 10 6 10 12" />
            <path d="M150 96c-6 0-6 8 0 8M194 96c6 0 6 8 0 8M159 120v-14h6v14M179 120v-14h6v14" />
            {/* mid skyscrapers */}
            <path d="M230 120V60h22v60M236 66h10M236 76h10M236 86h10M236 96h10M236 106h10" />
            <path d="M256 120V80h18v40M261 86h8M261 96h8M261 106h8" />
            {/* eiffel-like tower */}
            <path d="M330 120 348 44 366 120M338 90h20M334 104h28M345 44c0-5 6-5 6 0" />
            {/* arch / gateway */}
            <path d="M400 120V92h34v28M408 120v-16c0-9 18-9 18 0v16" />
            {/* right skyscraper cluster */}
            <path d="M470 120V66h22v54M476 72h10M476 82h10M476 92h10M476 102h10M476 112h10" />
            <path d="M496 120V84h18v36M501 90h8M501 100h8M501 110h8" />
            <path d="M520 120V96h26v24M526 102h14M526 110h14" />
        </svg>
    );
}
