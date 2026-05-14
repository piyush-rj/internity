import z from "zod";

const env_schema = z.object({
    SERVER_JWT_SECRET: z.string(),
    SERVER_PORT: z.coerce.number(),
    DATABASE_URL: z.url(),
    MINIO_ENDPOINT: z.url(), // e.g. http://localhost:9000
    MINIO_PUBLIC_ENDPOINT: z.url().optional(), // public-facing host if different from MINIO_ENDPOINT
    MINIO_ACCESS_KEY: z.string(),
    MINIO_SECRET_KEY: z.string(),
    MINIO_BUCKET: z.string(),
    MINIO_REGION: z.string().default("us-east-1"),
});

export let ENV: z.infer<typeof env_schema>;

export function parse_env() {
    try {
        ENV = env_schema.parse(process.env);
    } catch (err) {
        console.error("Failed to parse the env config: ", err);
        process.exit(1);
    }
}
