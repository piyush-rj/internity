import { randomUUID } from "node:crypto";
import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config/config.ts";

const s3 = new S3Client({
    endpoint: config.MINIO_ENDPOINT,
    region: config.MINIO_REGION,
    credentials: {
        accessKeyId: config.MINIO_ACCESS_KEY,
        secretAccessKey: config.MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
});

export function bucket(): string {
    return config.MINIO_BUCKET;
}

// returns an object key with a kind-prefixed user folder and uuid
export function buildObjectKey(kind: string, userId: string): string {
    return `${kind.toLowerCase()}/${userId}/${randomUUID()}`;
}

export async function presignPut(
    key: string,
    contentType: string,
    expiresInSec = 300,
): Promise<string> {
    return getSignedUrl(
        s3,
        new PutObjectCommand({
            Bucket: bucket(),
            Key: key,
            ContentType: contentType,
        }),
        { expiresIn: expiresInSec },
    );
}

export async function presignGet(
    key: string,
    expiresInSec = 3600,
): Promise<string> {
    return getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: bucket(), Key: key }),
        { expiresIn: expiresInSec },
    );
}

export async function deleteObject(key: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

export function publicUrlFor(key: string): string {
    const base = (config.MINIO_PUBLIC_ENDPOINT ?? config.MINIO_ENDPOINT)
        .toString()
        .replace(/\/$/, "");
    return `${base}/${bucket()}/${key}`;
}
