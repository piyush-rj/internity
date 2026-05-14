import type { Response } from "express";

interface JsonResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
    };
    metadata: {
        timestamp: string;
    };
}

export default class ResponseWriter {
    static success<T>(
        res: Response,
        data: T,
        message = "Request succeeded",
        status: number = 200,
    ) {
        const body: JsonResponse<T> = {
            success: true,
            data,
            message,
            metadata: { timestamp: new Date().toISOString() },
        };
        res.status(status).json(body);
    }

    static unauthorized(
        res: Response,
        message = "You are not authorized",
        status = 401,
    ) {
        this.send_error(res, status, "UNAUTHORIZED", message);
    }

    static invalid_data(res: Response, message = "Invalid data", status = 400) {
        this.send_error(res, status, "INVALID_REQUEST", message);
    }

    static not_found(res: Response, message = "Data not found") {
        this.send_error(res, 404, "NOT_FOUND", message);
    }

    static server_error(res: Response, message = "Internal server error") {
        this.send_error(res, 500, "INTERNAL_SERVER_ERROR", message);
    }

    private static send_error(
        res: Response,
        status: number,
        code: string,
        message: string,
    ) {
        const body: JsonResponse<never> = {
            success: false,
            error: { code, message },
            metadata: { timestamp: new Date().toISOString() },
        };
        res.status(status).json(body);
    }
}
