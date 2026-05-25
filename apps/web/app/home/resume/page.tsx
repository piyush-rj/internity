"use client";

import { useRef, useState } from "react";
import { FileText, Info, Trash2, Upload } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { studentApi, uploadApi } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMyProfile } from "@/src/hooks/useMyProfile";
import { useConfirm } from "@/src/hooks/useConfirm";
import { cn } from "@/src/lib/utils";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPE = "application/pdf";

export default function ResumePage() {
    const { profile, loading, refetch } = useMyProfile();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [removing, setRemoving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { confirm, dialogProps } = useConfirm();

    const currentResume = profile?.resumeUrl ?? null;

    async function handleFile(file: File) {
        setError(null);
        if (file.type !== ACCEPTED_TYPE) {
            setError("Only PDF files are supported.");
            return;
        }
        if (file.size > MAX_SIZE_BYTES) {
            setError("File must be under 10 MB.");
            return;
        }
        if (file.size === 0) {
            setError("That file looks empty.");
            return;
        }

        setUploading(true);
        setProgress(0);
        try {
            const { key, putUrl, getUrl } = await uploadApi.sign({
                kind: "RESUME",
                contentType: file.type,
                sizeBytes: file.size,
            });
            await putToPresignedUrl(putUrl, file, setProgress);
            await uploadApi.confirm({
                kind: "RESUME",
                key,
                contentType: file.type,
                sizeBytes: file.size,
            });
            // Some backends auto-update the profile on confirm; others don't.
            // Try patching the profile explicitly so the URL is visible
            // regardless. Swallow validation errors so we don't double-report.
            try {
                await studentApi.update({ resumeUrl: getUrl });
            } catch {
                /* best-effort */
            }
            await refetch();
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : "Upload failed.",
            );
        } finally {
            setUploading(false);
            setProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    async function handleRemove() {
        if (!currentResume) return;
        const ok = await confirm({
            title: "Remove your resume?",
            description:
                "You'll need to upload a new one before you can apply to any listings.",
            confirmLabel: "Remove resume",
            variant: "destructive",
        });
        if (!ok) return;
        setRemoving(true);
        setError(null);
        try {
            await studentApi.update({ resumeUrl: null });
            await refetch();
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn’t remove. Try again.",
            );
        } finally {
            setRemoving(false);
        }
    }

    function onDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }

    return (
        <EmptySection
            title="Resume"
            description="PDF only, up to 10 MB. Recruiters see this when you apply."
        >
            {!loading && !profile ? (
                <NoProfile />
            ) : (
                <>
                    {currentResume && (
                        <CurrentResume
                            url={currentResume}
                            onRemove={handleRemove}
                            removing={removing}
                            disabled={uploading}
                        />
                    )}

                    <section
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        className={cn(
                            "rounded-xl border-2 border-dashed p-10 text-center",
                            "transition-colors",
                            dragging
                                ? "border-brand bg-brand/5"
                                : "border-border bg-card hover:bg-secondary/40",
                            uploading && "pointer-events-none opacity-70",
                        )}
                    >
                        <div className="mx-auto h-10 w-10 inline-flex items-center justify-center rounded-full bg-secondary/60 text-muted-foreground">
                            <Upload className="h-5 w-5" />
                        </div>
                        <p className="mt-3 text-[14px] font-medium">
                            {currentResume
                                ? "Replace your resume"
                                : "Drop your resume here"}
                        </p>
                        <p className="mt-1 text-[12.5px] text-muted-foreground">
                            or click to browse — PDF, max 10 MB
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            className="sr-only"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFile(f);
                            }}
                        />

                        <Button
                            type="button"
                            variant="exec-dark"
                            disabled={uploading || !profile}
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 h-10 px-4 text-[13px] cursor-pointer"
                        >
                            {uploading
                                ? `Uploading… ${Math.round(progress)}%`
                                : currentResume
                                  ? "Choose new file"
                                  : "Choose file"}
                        </Button>

                        {uploading && (
                            <div className="mt-4 mx-auto max-w-xs">
                                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-brand transition-all duration-100"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </section>

                    {error && (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[12.5px] text-destructive">
                            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </>
            )}
            <ConfirmDialog {...dialogProps} />
        </EmptySection>
    );
}

function CurrentResume({
    url,
    onRemove,
    removing,
    disabled,
}: {
    url: string;
    onRemove: () => void;
    removing: boolean;
    disabled: boolean;
}) {
    return (
        <section className="rounded-xl border border-border bg-card overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                <h2 className="text-[14px] font-semibold">Current resume</h2>
            </header>
            <div className="px-5 py-4 flex items-center gap-3">
                <span className="h-10 w-10 inline-flex items-center justify-center rounded-md bg-secondary/60 text-foreground shrink-0">
                    <FileText className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[13.5px] font-medium hover:underline truncate block"
                    >
                        View resume
                    </a>
                    <p className="text-[11.5px] text-muted-foreground truncate">
                        Stored privately — only recruiters you apply to can see
                        it.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onRemove}
                    disabled={removing || disabled}
                    aria-label="Remove resume"
                    className={cn(
                        "h-8 w-8 inline-flex items-center justify-center rounded-md shrink-0",
                        "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                        "transition-colors disabled:opacity-50",
                    )}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </section>
    );
}

function NoProfile() {
    return (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-[14px] font-medium">No profile yet.</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
                Create your profile first, then come back to upload your resume.
            </p>
            <a
                href="/home/profile"
                className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline"
            >
                Go to profile →
            </a>
        </div>
    );
}

/** Direct PUT to S3-compatible presigned URL with progress tracking. */
function putToPresignedUrl(
    url: string,
    file: File,
    onProgress: (pct: number) => void,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
                onProgress((e.loaded / e.total) * 100);
            }
        });
        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else
                reject(
                    new Error(
                        `Upload failed (${xhr.status}) — try again in a moment.`,
                    ),
                );
        });
        xhr.addEventListener("error", () =>
            reject(new Error("Network error while uploading.")),
        );
        xhr.addEventListener("abort", () =>
            reject(new Error("Upload cancelled.")),
        );
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
    });
}
