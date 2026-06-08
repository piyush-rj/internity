"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import {
    ListingForm,
    type ListingFormHandle,
    type ListingFormState,
} from "@/src/components/manage-listings/ListingForm";
import { PostListingInstructions } from "@/src/components/manage-listings/PostListingInstructions";
import { TemplatePicker } from "@/src/components/manage-listings/TemplatePicker";
import { useMyEmployer } from "@/src/hooks/useMyEmployer";
import { useUserSessionStore } from "@/src/store/useUserSessionStore";
import { useAuthDialog } from "@/src/store/useAuthDialog";
import { draftApi } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { jobTitleLabel } from "@/src/lib/catalog/jobTitles";

// Best-effort display title for a saved draft, from whatever the founder has
// filled so far.
function draftTitleFrom(state: ListingFormState): string {
    const explicit = state.title?.trim();
    if (explicit) return explicit;
    if (state.jobTitle === "CUSTOM" && state.customJobTitle?.trim()) {
        return state.customJobTitle.trim();
    }
    if (state.jobTitle) return jobTitleLabel(state.jobTitle);
    return "Untitled draft";
}

// Shared localStorage key for the in-progress listing. A signed-out visitor's
// draft is stashed here on the gated Post, then restored once they're back on
// this page signed-in (after sign-up + company setup).
const DRAFT_KEY = "listing-draft:new";

export default function NewListingPage() {
    const initialized = useUserSessionStore((s) => s.initialized);
    const signedIn = useUserSessionStore((s) => !!s.session?.user?.id);

    return (
        <EmptySection
            title="Post a new listing"
            description="Share an internship with students across India."
        >
            {signedIn && (
                <Link
                    href="/home/manage-listings"
                    className="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to my listings
                </Link>
            )}

            <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
                <div className="min-w-0">
                    {!initialized ? (
                        <div className="rounded-lg border border-border bg-card p-6">
                            <FormSkeleton />
                        </div>
                    ) : signedIn ? (
                        <AuthedNewListing />
                    ) : (
                        <PublicNewListing />
                    )}
                </div>
                <div className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none">
                    <PostListingInstructions />
                </div>
            </section>
        </EmptySection>
    );
}

// Signed-in employer flow: needs a company to post under. Supports the
// founder "Save draft" feature — load a draft via ?draft=<id>, save the
// current form as a draft, and delete the draft once it's posted. Also keeps
// the localStorage restore (DRAFT_KEY) for the signed-out -> sign-up flow, but
// only when not editing a DB draft (so it can't clobber a loaded draft).
function AuthedNewListing() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const draftIdParam = searchParams?.get("draft") ?? null;

    const { memberships, loading } = useMyEmployer();
    const company = memberships[0]?.company ?? null;
    const status = company?.verificationStatus ?? null;
    const formRef = useRef<ListingFormHandle | null>(null);

    const [draftId, setDraftId] = useState<string | null>(draftIdParam);
    const [draftState, setDraftState] = useState<ListingFormState | null>(null);
    const [draftLoading, setDraftLoading] = useState(!!draftIdParam);

    useEffect(() => {
        if (!draftIdParam) return;
        let cancelled = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraftLoading(true);
        draftApi
            .get(draftIdParam)
            .then((res) => {
                if (cancelled) return;
                setDraftState(res.draft.data as unknown as ListingFormState);
                setDraftId(res.draft.id);
            })
            .catch(() => {
                if (!cancelled) toast.error("Couldn't load that draft.");
            })
            .finally(() => {
                if (!cancelled) setDraftLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [draftIdParam]);

    async function handleSaveDraft(state: ListingFormState) {
        const title = draftTitleFrom(state);
        const data = state as unknown as Record<string, unknown>;
        try {
            if (draftId) {
                await draftApi.update(draftId, { title, data });
            } else {
                const res = await draftApi.create({
                    title,
                    companyId: company?.id ?? null,
                    data,
                });
                setDraftId(res.draft.id);
            }
            toast.success("Draft saved.");
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't save draft.",
            );
        }
    }

    if (loading || draftLoading) {
        return (
            <div className="rounded-lg border border-border bg-card p-6">
                <FormSkeleton />
            </div>
        );
    }
    if (!company) {
        return (
            <div className="rounded-lg border border-border bg-card p-6">
                <NoCompany />
            </div>
        );
    }
    return (
        <div className="space-y-4">
            {status !== "APPROVED" && <VerificationBanner status={status} />}
            <TemplatePicker onPick={(t) => formRef.current?.applyTemplate(t)} />
            <ListingForm
                ref={formRef}
                companyId={company.id}
                draftKey={draftId ? undefined : DRAFT_KEY}
                initialState={draftState}
                onSaveDraft={handleSaveDraft}
                onCreated={async (id) => {
                    if (draftId) {
                        // The draft became a real listing — remove it. Failure
                        // is non-fatal; it can be cleared from the drafts list.
                        try {
                            await draftApi.remove(draftId);
                        } catch {
                            /* ignore */
                        }
                    }
                    router.push(`/home/listings/${id}`);
                }}
            />
        </div>
    );
}

// Signed-out flow: the full form is fillable (templates + autofill work, they
// run client-side). Post validates, saves the draft, and opens the sign-up
// dialog with this page as the return destination.
function PublicNewListing() {
    const openDialog = useAuthDialog((s) => s.openDialog);
    const formRef = useRef<ListingFormHandle | null>(null);
    return (
        <div className="space-y-4">
            <SignUpToPostBanner />
            <TemplatePicker onPick={(t) => formRef.current?.applyTemplate(t)} />
            <ListingForm
                ref={formRef}
                requireAuth
                draftKey={DRAFT_KEY}
                onAuthRequired={() => openDialog("/home/manage-listings/new")}
            />
        </div>
    );
}

function SignUpToPostBanner() {
    return (
        <div className="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-[12.5px] text-sky-900">
            <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
                Fill out your listing now — when you hit{" "}
                <strong className="font-semibold">Post listing</strong>,
                we&rsquo;ll ask you to create a free account to publish it. Your
                entries are saved.
            </span>
        </div>
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
                href="/home/employer/onboard"
                className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline"
            >
                Finish company setup
                <ArrowRight className="h-3.5 w-3.5" />
            </Link>
        </div>
    );
}

function VerificationBanner({
    status,
}: {
    status: "PENDING" | "REJECTED" | null;
}) {
    if (status === "REJECTED") {
        return (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50 px-3.5 py-2.5 text-[12.5px] text-amber-900">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                    Admin asked you to update some company details. Your
                    listings won&rsquo;t show the verified badge until
                    that&rsquo;s resolved.
                </span>
            </div>
        );
    }
    return (
        <div className="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-[12.5px] text-sky-900">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
                You can post listings right away. Once admin verifies your
                company (usually in a few hours), your listings will show the
                Verified badge.
            </span>
        </div>
    );
}
