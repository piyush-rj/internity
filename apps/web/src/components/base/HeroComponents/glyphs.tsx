import type { SVGProps } from "react";

export function ArrowUpRight(p: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...p}
        >
            <path d="M5 11 11 5M5 5h6v6" />
        </svg>
    );
}

export function ChevronRight(p: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...p}
        >
            <path d="m6 4 4 4-4 4" />
        </svg>
    );
}

export function BriefcaseGlyph(p: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" {...p}>
            <path d="M5.5 3a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 10.5 3v.5h2.25A1.25 1.25 0 0 1 14 4.75v6.5A1.25 1.25 0 0 1 12.75 12.5h-9.5A1.25 1.25 0 0 1 2 11.25v-6.5A1.25 1.25 0 0 1 3.25 3.5H5.5V3Zm1 0v.5h3V3a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0-.5.5Z" />
        </svg>
    );
}

export function BookGlyph(p: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" {...p}>
            <path d="M3 2.5A1.5 1.5 0 0 1 4.5 1H8v12H4.5A1.5 1.5 0 0 0 3 14.5v-12Zm10 0V14.5A1.5 1.5 0 0 0 11.5 13H8V1h3.5A1.5 1.5 0 0 1 13 2.5Z" />
        </svg>
    );
}

export function ShieldGlyph(p: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" {...p}>
            <path d="M8 1.5 2.5 3.25v4.5c0 3.4 2.4 6.2 5.5 7.25 3.1-1.05 5.5-3.85 5.5-7.25v-4.5L8 1.5Zm-.5 9.7L4.7 8.4l1.1-1.1 1.7 1.7 3.5-3.5 1.1 1.1-4.6 4.6Z" />
        </svg>
    );
}
