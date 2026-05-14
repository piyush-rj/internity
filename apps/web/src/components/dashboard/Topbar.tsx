import {
    BellIcon,
    HelpIcon,
    PlusIcon,
    SearchIcon,
} from "@/src/components/dashboard/icons";
import { cn } from "@/src/lib/utils";

export function Topbar() {
    return (
        <header className="h-14 border-b border-border bg-background/80 nav-blur sticky top-0 z-30">
            <div className="h-full flex items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <span className="text-foreground font-medium">
                        Dashboard
                    </span>
                </div>

                <div className="hidden md:flex flex-1 max-w-md mx-4">
                    <div
                        className={cn(
                            "flex w-full items-center gap-2 h-9 px-3",
                            "rounded-md border border-input bg-card",
                            "text-[13px]",
                            "focus-within:ring-2 focus-within:ring-ring/50",
                        )}
                    >
                        <SearchIcon className="text-muted-foreground h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search internships, jobs, companies…"
                            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                        />
                        <kbd
                            className={cn(
                                "hidden sm:inline",
                                "rounded border border-border bg-muted",
                                "px-1.5 py-0.5",
                                "text-[10px] font-mono text-muted-foreground",
                            )}
                        >
                            ⌘K
                        </kbd>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <a
                        href="#"
                        className={cn(
                            "hidden sm:inline-flex items-center gap-1.5 h-9 px-3",
                            "rounded-md bg-brand hover:bg-brand/90",
                            "text-[13px] font-medium text-white",
                            "transition-colors",
                        )}
                    >
                        <PlusIcon className="h-3.5 w-3.5" />
                        New application
                    </a>
                    <IconBtn label="Help">
                        <HelpIcon className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Notifications" dot>
                        <BellIcon className="h-4 w-4" />
                    </IconBtn>
                    <span
                        className={cn(
                            "ml-1 h-8 w-8 rounded-full",
                            "flex items-center justify-center",
                            "bg-linear-to-br from-pink-400 to-violet-500",
                            "text-white text-[12px] font-semibold",
                        )}
                    >
                        P
                    </span>
                </div>
            </div>
        </header>
    );
}

function IconBtn({
    children,
    label,
    dot,
}: {
    children: React.ReactNode;
    label: string;
    dot?: boolean;
}) {
    return (
        <button
            aria-label={label}
            className={cn(
                "relative h-9 w-9 inline-flex items-center justify-center",
                "rounded-md",
                "text-muted-foreground hover:bg-secondary hover:text-foreground",
                "transition-colors",
            )}
        >
            {children}
            {dot && (
                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand" />
            )}
        </button>
    );
}
