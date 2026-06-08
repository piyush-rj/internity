"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Plus, Trash2 } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { draftApi, MAX_DRAFTS, type ListingDraft } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";

export default function DraftsPage() {
    const router = useRouter();
    const [drafts, setDrafts] = useState<ListingDraft[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        draftApi
            .list()
            .then((res) => {
                if (!cancelled) setDrafts(res.items);
            })
            .catch(() => {
                if (!cancelled) toast.error("Couldn't load your drafts.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    async function remove(id: string) {
        setDeletingId(id);
        try {
            await draftApi.remove(id);
            setDrafts((d) => d.filter((x) => x.id !== id));
            toast.success("Draft deleted.");
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't delete draft.",
            );
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <EmptySection
            title="Drafts"
            description={`Saved listings you can finish and post later. ${drafts.length}/${MAX_DRAFTS} used.`}
        >
            {loading ? (
                <div className="space-y-2.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-16 rounded-lg border border-border bg-card animate-pulse"
                        />
                    ))}
                </div>
            ) : drafts.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                    <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-2 text-[13px] text-muted-foreground">
                        No drafts yet. Start a listing and hit “Save as draft”.
                    </p>
                    <Link
                        href="/home/manage-listings/new"
                        className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        New listing
                    </Link>
                </div>
            ) : (
                <ul className="space-y-2.5">
                    {drafts.map((d) => (
                        <li
                            key={d.id}
                            className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:border-neutral-300 transition-colors"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        `/home/manage-listings/new?draft=${d.id}`,
                                    )
                                }
                                className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
                            >
                                <FileText className="h-4 w-4 shrink-0 text-orange-500" />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[13.5px] font-medium text-foreground">
                                        {d.title}
                                    </span>
                                    <span className="block text-[11.5px] text-muted-foreground">
                                        Updated{" "}
                                        {new Date(
                                            d.updatedAt,
                                        ).toLocaleDateString(undefined, {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => remove(d.id)}
                                disabled={deletingId === d.id}
                                aria-label="Delete draft"
                                className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <Link
                href="/home/manage-listings/new"
                className="inline-flex items-center gap-1.5 mt-4 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
            >
                <Plus className="h-3.5 w-3.5" />
                New listing
            </Link>
        </EmptySection>
    );
}
