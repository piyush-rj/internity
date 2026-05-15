import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "../config/config.env";

let _client: S3Client | null = null;
function client(): S3Client {
    if (_client) return _client;
    _client = new S3Client({
        endpoint: ENV.MINIO_ENDPOINT,
        region: ENV.MINIO_REGION,
        credentials: {
            accessKeyId: ENV.MINIO_ACCESS_KEY,
            secretAccessKey: ENV.MINIO_SECRET_KEY,
        },
        forcePathStyle: true, // required for MinIO
    });
    return _client;
}

export function build_object_key(kind: string, userId: string): string {
    return `${kind.toLowerCase()}/${userId}/${crypto.randomUUID()}`;
}

export async function presign_put(
    key: string,
    contentType: string,
    expires_in_sec = 300,
): Promise<string> {
    return getSignedUrl(
        client(),
        new PutObjectCommand({
            Bucket: ENV.MINIO_BUCKET,
            Key: key,
            ContentType: contentType,
        }),
        { expiresIn: expires_in_sec },
    );
}

export async function presign_get(
    key: string,
    expires_in_sec = 3600,
): Promise<string> {
    return getSignedUrl(
        client(),
        new GetObjectCommand({ Bucket: ENV.MINIO_BUCKET, Key: key }),
        { expiresIn: expires_in_sec },
    );
}

export async function delete_object(key: string): Promise<void> {
    await client().send(
        new DeleteObjectCommand({ Bucket: ENV.MINIO_BUCKET, Key: key }),
    );
}

export function public_url_for(key: string): string {
    const base = ENV.MINIO_PUBLIC_ENDPOINT ?? ENV.MINIO_ENDPOINT;
    return `${base.replace(/\/$/, "")}/${ENV.MINIO_BUCKET}/${key}`;
}

export const MINIO_BUCKET = () => ENV.MINIO_BUCKET;
