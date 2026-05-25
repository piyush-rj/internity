/**
 * `types` — shared TypeScript contracts for the monorepo.
 *
 * Anything that crosses an app boundary (server <-> web, server <-> python,
 * cron jobs, etc.) should be declared here. Each domain gets its own
 * subdirectory under `src/`; add more subdirs (`rest_types/`, `email_types/`,
 * …) as the surface grows.
 */

export * from "./src/socket_types/index.ts";
