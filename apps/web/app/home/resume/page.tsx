"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileText, Info, Trash2, Upload } from "lucide-react";
import { EmptySection } from "@/src/components/dashboard/EmptySection";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { resumeApi, uploadApi, type Resume } from "@/src/lib/api";
import { ApiClientError } from "@/src/lib/apiClient";
import { useMyProfile } from "@/src/hooks/useMyProfile";
import { useConfirm } from "@/src/hooks/useConfirm";
import { cn } from "@/src/lib/utils";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_RESUMES = 4;
const ACCEPTED_TYPE = "application/pdf";

export default function ResumePage() {
    const { profile, loading, refetch } = useMyProfile();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [resumesLoading, setResumesLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { confirm, dialogProps } = useConfirm();

    async function loadResumes() {
        setResumesLoading(true);
        try {
            const { items } = await resumeApi.list();
            setResumes(items);
        } catch {
            setResumes([]);
        } finally {
            setResumesLoading(false);
        }
    }

    useEffect(() => {
        if (!profile) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadResumes();
    }, [profile]);

    const atLimit = resumes.length >= MAX_RESUMES;

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
        if (atLimit) {
            setError(
                `You can keep up to ${MAX_RESUMES} resumes. Delete one before uploading another.`,
            );
            return;
        }

        setUploading(true);
        setProgress(0);
        try {
            const { key, putUrl } = await uploadApi.sign({
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
                fileName: file.name,
            });
            await Promise.all([loadResumes(), refetch()]);
            toast.success("Resume uploaded.");
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

    async function setDefault(id: string) {
        try {
            await resumeApi.setDefault(id);
            await Promise.all([loadResumes(), refetch()]);
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't update default.",
            );
        }
    }

    async function remove(r: Resume) {
        const ok = await confirm({
            title: `Delete "${r.fileName}"?`,
            description:
                "Past applications keep the snapshot you sent with them. You can re-upload anytime.",
            confirmLabel: "Delete resume",
            variant: "destructive",
        });
        if (!ok) return;
        try {
            await resumeApi.remove(r.id);
            await Promise.all([loadResumes(), refetch()]);
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : "Couldn't delete. Try again.",
            );
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
            title="Resumes"
            description={`Up to ${MAX_RESUMES} PDFs (10 MB each). Recruiters see your chosen resume at apply time.`}
        >
            {!loading && !profile ? (
                <NoProfile />
            ) : (
                <>
                    <section className="rounded-lg border border-border bg-card overflow-hidden">
                        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                            <h2 className="text-[14px] font-semibold">
                                Your resumes{" "}
                                <span className="text-muted-foreground font-normal">
                                    ({resumes.length}/{MAX_RESUMES})
                                </span>
                            </h2>
                        </header>
                        {resumesLoading ? (
                            <div className="px-5 py-6 text-[12.5px] text-muted-foreground">
                                Loading resumes…
                            </div>
                        ) : resumes.length === 0 ? (
                            <div className="px-5 py-6 text-[12.5px] text-muted-foreground">
                                You haven&rsquo;t uploaded any resumes yet.
                            </div>
                        ) : (
                            <ul className="divide-y divide-border">
                                {resumes.map((r) => (
                                    <li
                                        key={r.id}
                                        className="px-5 py-3 flex items-center gap-3"
                                    >
                                        <span className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-secondary/60 text-foreground shrink-0">
                                            <FileText className="h-4 w-4" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <a
                                                href={r.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[13px] font-medium hover:underline truncate block"
                                            >
                                                {r.fileName}
                                            </a>
                                            <p className="text-[11px] text-muted-foreground">
                                                Uploaded{" "}
                                                {new Date(
                                                    r.createdAt,
                                                ).toLocaleDateString("en-IN")}
                                                {r.sizeBytes
                                                    ? ` · ${Math.max(1, Math.round(r.sizeBytes / 1024))} KB`
                                                    : ""}
                                            </p>
                                        </div>
                                        {r.isDefault ? (
                                            <span className="inline-flex items-center gap-1 text-[11.5px] text-emerald-700">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Default
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setDefault(r.id)}
                                                className="text-[11.5px] font-medium text-brand hover:underline cursor-pointer"
                                            >
                                                Set as default
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => remove(r)}
                                            aria-label={`Delete ${r.fileName}`}
                                            className={cn(
                                                "h-8 w-8 inline-flex items-center justify-center rounded-md shrink-0",
                                                "text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer",
                                            )}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section
                        onDragOver={(e) => {
                            e.preventDefault();
                            if (!atLimit) setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => {
                            if (atLimit) {
                                e.preventDefault();
                                return;
                            }
                            onDrop(e);
                        }}
                        className={cn(
                            "rounded-lg border-2 border-dashed p-10 text-center transition-colors",
                            dragging
                                ? "border-brand bg-brand/5"
                                : "border-border bg-card hover:bg-secondary/40",
                            (uploading || atLimit) &&
                                "pointer-events-none opacity-70",
                        )}
                    >
                        <div className="mx-auto h-10 w-10 inline-flex items-center justify-center rounded-full bg-secondary/60 text-muted-foreground">
                            <Upload className="h-5 w-5" />
                        </div>
                        <p className="mt-3 text-[14px] font-medium">
                            {atLimit
                                ? `You've hit ${MAX_RESUMES} resumes`
                                : "Drop a new resume here"}
                        </p>
                        <p className="mt-1 text-[12.5px] text-muted-foreground">
                            {atLimit
                                ? "Delete one to upload another."
                                : "or click to browse — PDF, max 10 MB"}
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
                            disabled={uploading || !profile || atLimit}
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 h-10 px-4 text-[13px] cursor-pointer"
                        >
                            {uploading
                                ? `Uploading… ${Math.round(progress)}%`
                                : "Upload resume"}
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

function NoProfile() {
    return (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
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

// uploads file via put to a presigned url with progress tracking
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
