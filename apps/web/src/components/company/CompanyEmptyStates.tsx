import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Shared "no company yet" prompt + loading skeleton for the /home/company/*
// sub-pages. The connect-a-company flow owns actually creating a company;
// these just point the user there.
export function NoCompany() {
    return (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-[14px] font-medium">
                You haven’t set up a company yet.
            </p>
            <Link
                href="/home/employer/onboard"
                className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline"
            >
                Finish company setup
                <ArrowRight className="h-3.5 w-3.5" />
            </Link>
        </div>
    );
}

export function CompanyCardSkeleton() {
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
                <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-md bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 rounded-full bg-muted" />
                        <div className="h-2.5 w-2/3 rounded-full bg-muted" />
                    </div>
                </div>
            </div>
            <div className="h-32 w-full rounded-lg bg-secondary/40 animate-pulse" />
        </div>
    );
}
