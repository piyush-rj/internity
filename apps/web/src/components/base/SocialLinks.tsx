import { SOCIAL_LINKS } from "@/src/lib/socials";
import { cn } from "@/src/lib/utils";

// Reusable row of social icon links. Data lives in @/src/lib/socials.
export function SocialLinks({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/10 text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                >
                    <Icon className="h-4 w-4" />
                </a>
            ))}
        </div>
    );
}
