import z from "zod";

const env_schema = z.object({
    NEXT_PUBLIC_BACKEND_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    // Public — Zego AppID is safe in the browser; the server-side secret
    // never leaves the API. Optional so the app still boots without calling.
    NEXT_PUBLIC_ZEGO_APP_ID: z.coerce.number().int().positive().optional(),
});

const parsed = env_schema.safeParse({
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_ZEGO_APP_ID: process.env.NEXT_PUBLIC_ZEGO_APP_ID,
});

if (!parsed.success) {
    console.error(
        "Invalid environment variables:",
        z.treeifyError(parsed.error),
    );
    throw new Error("Invalid environment variables");
}

export const ENV: z.infer<typeof env_schema> = parsed.data;
