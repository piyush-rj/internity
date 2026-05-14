import "server-only";
import z from "zod";

const env_schema = z.object({
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
});

const parsed = env_schema.safeParse({
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
});

if (!parsed.success) {
    console.error(
        "Invalid server environment variables:",
        z.treeifyError(parsed.error),
    );
    throw new Error("Invalid server environment variables");
}

export const SERVER_ENV: z.infer<typeof env_schema> = parsed.data;
