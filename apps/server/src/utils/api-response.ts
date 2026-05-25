import type { Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "../db.ts";

export type ApiResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
    metadata: { timestamp: string };
    message?: string;
};

export class ResponseWriter {
    constructor(private readonly res: Response) {}

    ok<T>(data: T, message?: string): Response {
        return this.send(200, { success: true, data, message });
    }

    created<T>(data: T, message?: string): Response {
        return this.send(201, { success: true, data, message });
    }

    fail(status: number, code: string, message: string): Response {
        return this.send(status, {
            success: false,
            error: { code, message },
        });
    }

    notFound(message = "Not found"): Response {
        return this.fail(404, "NOT_FOUND", message);
    }

    unauthorized(message = "Unauthorized"): Response {
        return this.fail(401, "UNAUTHORIZED", message);
    }

    forbidden(message = "Forbidden"): Response {
        return this.fail(403, "FORBIDDEN", message);
    }

    invalidRequest(message = "Invalid request"): Response {
        return this.fail(400, "INVALID_REQUEST", message);
    }

    internalError(message = "Internal server error"): Response {
        return this.fail(500, "INTERNAL_SERVER_ERROR", message);
    }

    private send<T>(
        status: number,
        body: Omit<ApiResponse<T>, "metadata">,
    ): Response {
        const envelope: ApiResponse<T> = {
            ...body,
            metadata: { timestamp: new Date().toISOString() },
        };
        return this.res.status(status).json(envelope);
    }
}

export class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(message: string, opts: { status: number; code: string }) {
        super(message);
        this.name = "ApiError";
        this.status = opts.status;
        this.code = opts.code;
    }
}

export class Unauthorized extends ApiError {
    constructor(message = "Unauthorized") {
        super(message, { status: 401, code: "UNAUTHORIZED" });
    }
}
export class Forbidden extends ApiError {
    constructor(message = "Forbidden") {
        super(message, { status: 403, code: "FORBIDDEN" });
    }
}
export class InvalidRequest extends ApiError {
    constructor(message = "Invalid request") {
        super(message, { status: 400, code: "INVALID_REQUEST" });
    }
}
export class NotFound extends ApiError {
    constructor(message = "Not found") {
        super(message, { status: 404, code: "NOT_FOUND" });
    }
}

/**
 * Single catch-block translator for controllers. Maps ApiError, ZodError, and
 * common Prisma error codes to user-friendly responses; falls back to a
 * generic 500 for anything unknown (and logs to console for debugging).
 *
 * Usage:
 *   try { ... } catch (err) { handleApiError(err, api); }
 *
 * Keeps every controller's catch-block to a single line and ensures unique
 * constraint / not-found / fk-violation errors never leak as "Internal
 * server error" to the user.
 */
export function handleApiError(err: unknown, api: ResponseWriter): void {
    if (err instanceof ApiError) {
        api.fail(err.status, err.code, err.message);
        return;
    }
    if (err instanceof ZodError) {
        const issue = err.issues[0];
        api.invalidRequest(issue?.message ?? "Please check your details");
        return;
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case "P2002": {
                // Unique constraint — surface the conflicting field if Prisma
                // reports it so users can fix the right input.
                const target = (err.meta?.target as string[] | undefined) ?? [];
                const field = target.length > 0 ? target.join(", ") : "value";
                api.fail(
                    409,
                    "DUPLICATE",
                    `This ${field} is already in use. Try a different one.`,
                );
                return;
            }
            case "P2025":
                // Record not found (update/delete missing row).
                api.fail(
                    404,
                    "NOT_FOUND",
                    "We couldn't find what you're trying to update.",
                );
                return;
            case "P2003":
                // Foreign key constraint failed.
                api.fail(
                    400,
                    "INVALID_REFERENCE",
                    "Something this depends on no longer exists. Refresh and try again.",
                );
                return;
            case "P2014":
                // Required relation violation.
                api.fail(
                    400,
                    "INVALID_RELATION",
                    "Operation conflicts with related data.",
                );
                return;
        }
    }
    // Unknown — log full error server-side, send a clean generic message.
    console.error(err);
    api.internalError();
}
