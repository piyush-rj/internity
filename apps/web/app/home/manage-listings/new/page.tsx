"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Clock } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import {
    ListingForm,
    type ListingFormHandle,
} from "@/src/components/manage-listings/ListingForm";
import { TemplatePicker } from "@/src/components/manage-listings/TemplatePicker";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";

export default function NewListingPage() {
    const router = useRouter();
    const { memberships, loading } = useMyEmployer();
    const company = memberships[0]?.company ?? null;
    const status = company?.verificationStatus ?? null;
    const formRef = useRef<ListingFormHandle | null>(null);

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

            <section className="mx-auto max-w-3xl">
                {loading ? (
                    <div className="rounded-lg border border-border bg-card p-6">
                        <FormSkeleton />
                    </div>
                ) : !company ? (
                    <div className="rounded-lg border border-border bg-card p-6">
                        <NoCompany />
                    </div>
                ) : status === "APPROVED" ? (
                    <div className="space-y-4">
                        <TemplatePicker
                            onPick={(t) => formRef.current?.applyTemplate(t)}
                        />
                        <ListingForm
                            ref={formRef}
                            companyId={company.id}
                            onCreated={(id) => router.push(`/home/listings/${id}`)}
                        />
                    </div>
                ) : status === "PENDING" ? (
                    <div className="rounded-lg border border-border bg-card p-6">
                        <PendingNotice />
                    </div>
                ) : (
                    <div className="rounded-lg border border-border bg-card p-6">
                        <RejectedNotice note={company.rejectionNote} />
                    </div>
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

function PendingNotice() {
    return (
        <div className="flex flex-col items-center text-center py-10 px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Clock className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-[14px] font-semibold">
                You’re not approved by admin yet
            </h3>
            <p className="mt-1.5 max-w-md text-[12.5px] text-muted-foreground leading-relaxed">
                We’re reviewing your company details. Verification usually takes
                under 24 hours. You’ll be able to post once approved — we’ll
                send a notification.
            </p>
            <Link
                href="/home/dashboard"
                className="mt-4 inline-flex items-center text-[12.5px] font-medium text-brand hover:underline"
            >
                Go to dashboard
            </Link>
        </div>
    );
}

function RejectedNotice({ note }: { note: string | null }) {
    return (
        <div className="flex flex-col items-center text-center py-10 px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700">
                <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-[14px] font-semibold">
                Admin asked for updates before you can post
            </h3>
            {note && (
                <p className="mt-2 max-w-md rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-900 leading-relaxed">
                    {note}
                </p>
            )}
            <Link
                href="/home/employer/setup"
                className="mt-4 inline-flex items-center text-[12.5px] font-medium text-brand hover:underline"
            >
                Update company details →
            </Link>
        </div>
    );
}
