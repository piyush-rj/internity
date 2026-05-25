import "dotenv/config";
import { z } from "zod";

// Render (and most PaaS providers) inject the bind port as `PORT`. Prefer it
// over our own `SERVER_PORT` so the same code runs locally and in production.
if (process.env.PORT && !process.env.SERVER_PORT) {
    process.env.SERVER_PORT = process.env.PORT;
}

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

    // Comma-separated list of admin emails. Any user who signs in with an
    // email in this list is treated as an admin (in addition to anyone whose
    // User.role is ADMIN in the DB). ADMIN_EMAIL (singular) is also accepted
    // as a convenience and merged with the plural one.
    ADMIN_EMAILS: z.string().optional().default(""),
    ADMIN_EMAIL: z.string().optional().default(""),
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

export const ADMIN_EMAIL_SET: ReadonlySet<string> = new Set(
    [config.ADMIN_EMAILS, config.ADMIN_EMAIL]
        .flatMap((s) => s.split(","))
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
);

/** Treat the user as an admin if their email is whitelisted OR their role is ADMIN. */
export function isAdminUser(user: {
    role: string;
    email: string | null;
}): boolean {
    if (user.role === "ADMIN") return true;
    if (!user.email) return false;
    return ADMIN_EMAIL_SET.has(user.email.toLowerCase());
}
