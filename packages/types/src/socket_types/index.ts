/**
 * Wire-format contracts for the chat WebSocket.
 *
 * Both the TypeScript server (apps/server) and the web app (apps/web) import
 * from `types` — the schemas here ARE the protocol. Any change is a breaking
 * change for both sides; bump it in lock-step.
 */

export * from "./enums.ts";
export * from "./dtos.ts";
export * from "./client_messages.ts";
export * from "./server_messages.ts";
