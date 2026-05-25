import z from "zod";

const env_schema = z.object({
    NEXT_PUBLIC_BACKEND_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const parsed = env_schema.safeParse({
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
    console.error(
        "Invalid environment variables:",
        z.treeifyError(parsed.error),
    );
    throw new Error("Invalid environment variables");
}

export const ENV: z.infer<typeof env_schema> = parsed.data;
