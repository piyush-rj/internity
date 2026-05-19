import "dotenv/config";
import { z } from "zod";

const schema = z.object({
    SERVER_PORT: z.coerce.number().int().positive().default(8081),
    DATABASE_URL: z.string().url(),

    // Supabase Auth — used to verify Supabase-issued JWTs.
    SUPABASE_URL: z.string().url(),
    SUPABASE_JWT_SECRET: z.string().min(1),

    // MinIO / S3.
    MINIO_ENDPOINT: z.string().url(),
    MINIO_PUBLIC_ENDPOINT: z.string().url().optional(),
    MINIO_ACCESS_KEY: z.string().min(1),
    MINIO_SECRET_KEY: z.string().min(1),
    MINIO_BUCKET: z.string().min(1),
    MINIO_REGION: z.string().default("us-east-1"),

    // Razorpay — optional, /payment endpoints surface a clear error if missing.
    SERVER_RAZORPAY_ID: z.string().optional(),
    SERVER_RAZORPAY_SECRET: z.string().optional(),

    CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    console.error(
        "Invalid environment variables:",
        z.treeifyError(parsed.error),
    );
    throw new Error("Invalid environment variables");
}

export const config: z.infer<typeof schema> = parsed.data;
