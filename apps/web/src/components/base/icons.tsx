import type { SVGProps } from "react";

export function BrandMark(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <defs>
                <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#bm)" />
            <path
                d="M7 9.5h2.2v7H7v-7Zm1.1-3.6a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Zm3.4 3.6h2.1v.95c.55-.72 1.4-1.15 2.4-1.15 1.9 0 3 1.2 3 3.3v3.9h-2.2v-3.5c0-1.1-.5-1.7-1.45-1.7-1 0-1.55.65-1.55 1.85v3.35h-2.3v-7Z"
                fill="#fff"
            />
        </svg>
    );
}

export function ArrowRight(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" fill="none" {...props}>
            <path
                d="M3 8h10m0 0L8 3m5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" fill="none" {...props}>
            <circle
                cx="7"
                cy="7"
                r="4.5"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="m13 13-2.5-2.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" fill="none" {...props}>
            <path
                d="m3 8 3.5 3.5L13 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

const stroke = {
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
};

export function BuildingIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" {...props}>
            <rect x="3" y="2" width="10" height="12" rx="0.75" {...stroke} />
            <path
                d="M5.5 4.5h1M9.5 4.5h1M5.5 7.25h1M9.5 7.25h1M5.5 10h1M9.5 10h1M7 14v-2h2v2"
                {...stroke}
            />
        </svg>
    );
}

export function BookOpenIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" {...props}>
            <path
                d="M2 3.5h4.25c.97 0 1.75.78 1.75 1.75v8c0-.83-.67-1.5-1.5-1.5H2v-8.25ZM14 3.5H9.75c-.97 0-1.75.78-1.75 1.75v8c0-.83.67-1.5 1.5-1.5H14V3.5Z"
                {...stroke}
            />
        </svg>
    );
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" {...props}>
            <path
                d="M2.5 6.5 8 2.5l5.5 4V13a.5.5 0 0 1-.5.5h-2.5v-4h-5v4H3a.5.5 0 0 1-.5-.5V6.5Z"
                {...stroke}
            />
        </svg>
    );
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" {...props}>
            <circle cx="8" cy="6" r="2.75" {...stroke} />
            <path d="M3 13.5c0-2.5 2.25-4 5-4s5 1.5 5 4" {...stroke} />
        </svg>
    );
}

export function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" {...props}>
            <rect x="2" y="5" width="12" height="8.5" rx="1.25" {...stroke} />
            <path
                d="M5.5 5V3.75A.75.75 0 0 1 6.25 3h3.5a.75.75 0 0 1 .75.75V5M2 9h12"
                {...stroke}
            />
        </svg>
    );
}

export function BookmarkIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" {...props}>
            <path
                d="M4 2.75A.75.75 0 0 1 4.75 2h6.5a.75.75 0 0 1 .75.75V14l-4-2.5L4 14V2.75Z"
                {...stroke}
            />
        </svg>
    );
}

export function FileTextIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" {...props}>
            <path
                d="M3.5 2.75A.75.75 0 0 1 4.25 2H9l3.5 3.5v7.75a.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75V2.75Z"
                {...stroke}
            />
            <path d="M9 2v3.5h3.5M6 8.5h4M6 11h4" {...stroke} />
        </svg>
    );
}

export function SlidersIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" {...props}>
            <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" {...stroke} />
            <circle cx="5" cy="4.5" r="1.25" {...stroke} fill="#fff" />
            <circle cx="10.5" cy="8" r="1.25" {...stroke} fill="#fff" />
            <circle cx="6.5" cy="11.5" r="1.25" {...stroke} fill="#fff" />
        </svg>
    );
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" {...props}>
            <path
                d="M8 2 3 4v4c0 3.2 2.2 5.4 5 6 2.8-.6 5-2.8 5-6V4L8 2Z"
                {...stroke}
            />
        </svg>
    );
}

export function HelpCircleIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" {...props}>
            <circle cx="8" cy="8" r="5.75" {...stroke} />
            <path
                d="M6.4 6.4a1.6 1.6 0 1 1 2.4 1.4c-.5.3-.8.6-.8 1.2"
                {...stroke}
            />
            <circle cx="8" cy="11.25" r="0.5" fill="currentColor" />
        </svg>
    );
}

export function LogOutIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 16 16" {...props}>
            <path
                d="M9 13H4a.5.5 0 0 1-.5-.5v-9A.5.5 0 0 1 4 3h5M10 5.5 12.5 8 10 10.5M6.5 8h6"
                {...stroke}
            />
        </svg>
    );
}
