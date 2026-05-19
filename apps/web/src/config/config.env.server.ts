import "server-only";
import z from "zod";

const env_schema = z.object({});

const parsed = env_schema.safeParse({});

if (!parsed.success) {
    console.error(
        "Invalid server environment variables:",
        z.treeifyError(parsed.error),
    );
    throw new Error("Invalid server environment variables");
}

export const SERVER_ENV: z.infer<typeof env_schema> = parsed.data;
