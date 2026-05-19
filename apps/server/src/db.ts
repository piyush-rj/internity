// Re-export the Prisma client from the workspace `database` package so
// route handlers don't reach into the database package's internals.
export { prisma } from "database";
export * from "database";
