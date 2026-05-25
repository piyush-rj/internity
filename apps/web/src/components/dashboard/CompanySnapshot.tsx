"use client";

import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { PiBuildings, PiUsers } from "react-icons/pi";
import { Button } from "@/src/components/ui/button";
import { useCompanyMembers } from "@/src/hooks/useCompanyMembers";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { cn } from "@/src/lib/utils";

export function CompanySnapshot() {
    const { memberships, loading } = useMyEmployer();
    const membership = memberships[0] ?? null;
    const companyId = membership?.company.id ?? null;
    const { members, loading: membersLoading } = useCompanyMembers(companyId);

    return (
        <section className="space-y-4">
            <div className="rounded-md border border-border bg-card/90 backdrop-blur-sm shadow-xs p-5 transition-shadow duration-200 hover:shadow-sm">
                <div className="flex items-start gap-3">
                    {loading ? (
                        <span className="h-12 w-12 rounded-md bg-secondary animate-pulse shrink-0" />
                    ) : (
                        <Logo
                            name={membership?.company.name ?? "—"}
                            logoUrl={membership?.company.logoUrl ?? null}
                        />
                    )}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-[15px] font-semibold truncate">
                            {loading ? (
                                <span className="inline-block h-4 w-32 rounded-md bg-secondary animate-pulse" />
                            ) : (
                                membership?.company.name
                            )}
                        </h2>
                        {membership?.company.industry && (
                            <p className="mt-0.5 text-[12px] text-muted-foreground truncate inline-flex items-center gap-1">
                                <PiBuildings className="h-3 w-3" />
                                {membership.company.industry}
                            </p>
                        )}
                    </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                    <Stat
                        label="Members"
                        value={membersLoading ? "—" : String(members.length)}
                        icon={<PiUsers className="h-3 w-3" />}
                    />
                    <Stat
                        label="Your role"
                        value={
                            membership?.role === "OWNER" ? "Owner" : "Member"
                        }
                    />
                </dl>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link href="/home/company">
                        <Button
                            type="button"
                            variant="exec-light"
                            className="w-full h-9 text-[12.5px] cursor-pointer"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Manage
                        </Button>
                    </Link>
                    <Link href="/home/manage-listings/new">
                        <Button
                            type="button"
                            variant="exec-dark"
                            className="w-full h-9 text-[12.5px] cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New listing
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}

function Logo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
    if (logoUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={logoUrl}
                alt={`${name} logo`}
                className="h-12 w-12 rounded-md object-cover bg-white ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span
            className={cn(
                "h-12 w-12 rounded-md flex items-center justify-center shrink-0",
                "bg-secondary text-foreground text-[18px] font-semibold ring-1 ring-border",
            )}
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function Stat({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-border bg-background px-3 py-2">
            <dt className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                {icon}
                {label}
            </dt>
            <dd className="mt-0.5 text-[15px] font-semibold tabular-nums">
                {value}
            </dd>
        </div>
    );
}
