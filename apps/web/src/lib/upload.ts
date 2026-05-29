import { uploadApi } from "@/src/lib/api";

export type UploadKind = "RESUME" | "COMPANY_LOGO" | "PROFILE_IMAGE";

// uploads a file via the signed put url and confirms with the server, returns the public get url
export async function uploadAsset(input: {
    kind: UploadKind;
    file: File;
    companyId?: string;
    fileName?: string;
    onProgress?: (pct: number) => void;
}): Promise<{ getUrl: string; key: string }> {
    const { kind, file, companyId, fileName, onProgress } = input;
    const { key, putUrl, getUrl } = await uploadApi.sign({
        kind,
        contentType: file.type,
        sizeBytes: file.size,
    });
    await putToPresignedUrl(putUrl, file, onProgress);
    await uploadApi.confirm({
        kind,
        key,
        contentType: file.type,
        sizeBytes: file.size,
        companyId,
        fileName,
    });
    return { getUrl, key };
}

// xhr put upload with progress reporting
function putToPresignedUrl(
    url: string,
    file: File,
    onProgress?: (pct: number) => void,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        if (onProgress) {
            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    onProgress((e.loaded / e.total) * 100);
                }
            });
        }
        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else
                reject(
                    new Error(
                        `Upload failed (${xhr.status}). Try again in a moment.`,
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
