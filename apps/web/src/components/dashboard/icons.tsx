import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};

export function HomeIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5Z" />
        </svg>
    );
}

export function BriefcaseIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" />
        </svg>
    );
}

export function BuildingIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <rect x="4" y="3" width="16" height="18" rx="1" />
            <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" />
        </svg>
    );
}

export function BookOpenIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <path d="M3 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3V5ZM21 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8V5Z" />
        </svg>
    );
}

export function FileTextIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
            <path d="M14 3v6h6M8 13h8M8 17h8M8 9h2" />
        </svg>
    );
}

export function BookmarkIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
        </svg>
    );
}

export function UserIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
    );
}

export function SettingsIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
    );
}

export function SearchIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    );
}

export function BellIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.5 21a1.5 1.5 0 0 0 3 0" />
        </svg>
    );
}

export function PlusIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

export function ChevronRightIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <path d="m9 6 6 6-6 6" />
        </svg>
    );
}

export function TrendingUpIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <path d="m3 17 6-6 4 4 8-8M14 7h7v7" />
        </svg>
    );
}

export function CheckIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <path d="M4 12.5 9 17l11-11" />
        </svg>
    );
}

export function ClockIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </svg>
    );
}

export function MapPinIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <path d="M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12Z" />
            <circle cx="12" cy="9" r="2.5" />
        </svg>
    );
}

export function SparklesIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <path d="m12 3 1.8 4.6L18 9l-4.2 1.6L12 15l-1.8-4.4L6 9l4.2-1.4L12 3ZM19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2ZM5 16l.6 1.4L7 18l-1.4.6L5 20l-.6-1.4L3 18l1.4-.6L5 16Z" />
        </svg>
    );
}

export function HelpIcon(p: IconProps) {
    return (
        <svg {...base} {...p}>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" />
        </svg>
    );
}
