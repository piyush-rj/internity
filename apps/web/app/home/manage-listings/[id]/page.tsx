"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { ListingForm } from "@/src/components/manage-listings/ListingForm";
import { useBreadcrumbLabel } from "@/src/components/dashboard/BreadcrumbContext";
import { useListing } from "@/src/hooks/useListing";

export default function EditListingPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const { listing, loading, error } = useListing(id);
    useBreadcrumbLabel(listing ? `Edit ${listing.title}` : null);

    return (
        <EmptySection
            title="Edit listing"
            description="Update the details of your internship posting."
        >
            <Link
                href="/home/manage-listings"
                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to my listings
            </Link>

            <section className="max-w-3xl">
                {loading && !listing ? (
                    <div className="rounded-lg border border-border bg-card p-6">
                        <FormSkeleton />
                    </div>
                ) : error || !listing ? (
                    <div className="rounded-lg border border-border bg-card p-6 text-center">
                        <p className="text-[13px] text-muted-foreground">
                            {error?.message ??
                                "This listing may have been removed or its link is invalid."}
                        </p>
                        <Link
                            href="/home/manage-listings"
                            className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline"
                        >
                            Back to my listings
                        </Link>
                    </div>
                ) : (
                    <ListingForm
                        companyId={listing.companyId}
                        initial={listing}
                        onSaved={() => router.push(`/home/listings/${id}`)}
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
