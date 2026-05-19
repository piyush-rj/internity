import type { Response } from "express";

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
