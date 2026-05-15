"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ListingForm } from "@/src/components/manage-listings/ListingForm";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";

export default function NewListingPage() {
    const router = useRouter();
    const { memberships, loading } = useMyEmployer();
    const companyId = memberships[0]?.company.id ?? null;

    return (
        <EmptySection
            title="Post a new listing"
            description="Share an internship or job with verified students across India."
        >
            <Link
                href="/home/manage-listings"
                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to my listings
            </Link>

            <section className="rounded-xl border border-border bg-card p-6">
                {loading ? (
                    <FormSkeleton />
                ) : !companyId ? (
                    <NoCompany />
                ) : (
                    <ListingForm
                        companyId={companyId}
                        onCreated={(id) => router.push(`/home/listings/${id}`)}
                    />
                )}
            </section>
        </EmptySection>
    );
}

function FormSkeleton() {
    return (
        <div className="animate-pulse space-y-3">
            <div className="h-10 w-1/2 rounded-md bg-secondary" />
            <div className="h-10 w-full rounded-md bg-secondary" />
            <div className="h-24 w-full rounded-md bg-secondary" />
        </div>
    );
}

function NoCompany() {
    return (
        <div className="text-center py-8">
            <p className="text-[13px] text-muted-foreground">
                You haven’t set up a company yet.
            </p>
            <Link
                href="/home/employer/setup"
                className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline"
            >
                Finish employer setup →
            </Link>
        </div>
    );
}
