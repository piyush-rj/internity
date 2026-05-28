import "dotenv/config";
import { z } from "zod";

// prefer PORT injected by paas providers over SERVER_PORT
if (process.env.PORT && !process.env.SERVER_PORT) {
    process.env.SERVER_PORT = process.env.PORT;
}

const schema = z.object({
    SERVER_PORT: z.coerce.number().int().positive().default(8081),
    DATABASE_URL: z.string().url(),

    SUPABASE_URL: z.string().url(),
    SUPABASE_JWT_SECRET: z.string().min(1),
    SERVER_RAZORPAY_ID: z.string().optional(),
    SERVER_RAZORPAY_SECRET: z.string().optional(),

    CORS_ORIGIN: z.string().default("http://localhost:3000"),

    ADMIN_EMAILS: z.string().optional().default(""),
    ADMIN_EMAIL: z.string().optional().default(""),

    GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
    GOOGLE_OAUTH_REDIRECT_URI: z.string().url().optional(),
    OAUTH_STATE_SECRET: z.string().optional(),
    APP_URL: z.string().url().default("http://localhost:3000"),
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

export function isAdminUser(user: {
    role: string;
    email: string | null;
}): boolean {
    if (user.role === "ADMIN") return true;
    if (!user.email) return false;
    return ADMIN_EMAIL_SET.has(user.email.toLowerCase());
}
