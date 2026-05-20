import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError, ResponseWriter } from "../utils/api-response.ts";

/**
 * Global Express error handler.
 *
 * Converts thrown `ApiError`s and `ZodError`s into the standard JSON envelope
 * so the frontend always sees `{ success: false, error: { code, message } }`
 * — never Express's default HTML 500. Pair with `express-async-errors` so
 * async-thrown errors propagate here too.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const api = new ResponseWriter(res);

    if (err instanceof ApiError) {
        api.fail(err.status, err.code, err.message);
        return;
    }

    if (err instanceof ZodError) {
        const issue = err.issues[0];
        const where = issue?.path.join(".") || "body";
        api.invalidRequest(`Invalid ${where}: ${issue?.message ?? "invalid"}`);
        return;
    }

    console.error("unhandled error:", err);
    api.internalError();
};
