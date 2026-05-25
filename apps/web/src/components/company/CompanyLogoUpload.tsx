"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ApiClientError } from "@/src/lib/apiClient";
import { uploadAsset } from "@/src/lib/upload";
import { cn } from "@/src/lib/utils";

const LOGO_ACCEPT = "image/png,image/jpeg,image/webp";
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export function CompanyLogoUpload({
    companyId,
    name,
    logoUrl,
    onUploaded,
}: {
    companyId: string;
    name: string;
    logoUrl: string | null;
    onUploaded: (url: string) => void;
}) {
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);

    async function handleFile(file: File) {
        if (!file.type || !LOGO_ACCEPT.split(",").includes(file.type)) {
            toast.error("Please pick a PNG, JPG, or WEBP image.");
            return;
        }
        if (file.size > LOGO_MAX_BYTES) {
            toast.error("Logo must be under 2 MB.");
            return;
        }
        if (file.size === 0) {
            toast.error("That file looks empty.");
            return;
        }
        setUploading(true);
        try {
            const { getUrl } = await uploadAsset({
                kind: "COMPANY_LOGO",
                file,
                companyId,
            });
            onUploaded(getUrl);
            toast.success("Logo uploaded.");
        } catch (err) {
            toast.error(
                err instanceof ApiClientError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : "Upload failed.",
            );
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    return (
        <div className="flex items-center gap-3">
            <LogoPreview name={name} logoUrl={logoUrl} />
            <div className="flex flex-col gap-1.5 min-w-0">
                <Button
                    type="button"
                    variant="exec-light"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="h-9 px-3 text-[12.5px] cursor-pointer w-fit rounded-md"
                >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    {uploading
                        ? "Uploading…"
                        : logoUrl
                          ? "Change logo"
                          : "Upload logo"}
                </Button>
                <span className="text-[11px] text-muted-foreground">
                    PNG, JPG, or WEBP up to 2 MB.
                </span>
            </div>
            <input
                ref={fileRef}
                type="file"
                accept={LOGO_ACCEPT}
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                }}
                className="hidden"
            />
        </div>
    );
}

function LogoPreview({
    name,
    logoUrl,
}: {
    name: string;
    logoUrl: string | null;
}) {
    if (logoUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={logoUrl}
                alt={`${name} logo`}
                className="h-14 w-14 rounded-md object-cover bg-white ring-1 ring-border shrink-0"
            />
        );
    }
    return (
        <span
            className={cn(
                "h-14 w-14 rounded-md flex items-center justify-center shrink-0",
                "bg-secondary text-foreground text-[20px] font-semibold ring-1 ring-border",
            )}
        >
            {name.charAt(0).toUpperCase() || "?"}
        </span>
    );
}
