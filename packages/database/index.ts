import process from "node:process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.ts";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const createPrismaClient = () =>
    new PrismaClient({
        adapter: new PrismaPg({
            connectionString: process.env.DATABASE_URL,
            // Supabase's pooler closes idle connections after its own timeout.
            // keepAlive lets pg notice a half-dead socket, and recycling our
            // idle conns sooner (30s) means we close them before the server
            // does — which is what was causing the intermittent P1017
            // "Server has closed the connection" errors.
            keepAlive: true,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 10_000,
            // Supabase's session-mode pooler caps the whole project at
            // pool_size: 15 clients. Keep our pool well under that so we don't
            // hit EMAXCONNSESSION (leaves headroom for migrations, a second
            // backend, and dev-reload overlap).
            max: 8,
        }),
    });

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "./generated/prisma/client.ts";
