import type { Request, Response, NextFunction } from "express";
import ResponseWriter from "../class/response_writer";
import JwtServices from "../services/auth_services/jwt_services";

export default function auth_middleware(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const auth_header = req.headers.authorization;
    if (!auth_header || !auth_header.startsWith("Bearer ")) {
        ResponseWriter.unauthorized(res);
        return;
    }

    try {
        const token = auth_header.slice("Bearer ".length).trim();
        if (!token) {
            ResponseWriter.unauthorized(res);
            return;
        }

        const decoded = JwtServices.verify_token(token);
        if (!decoded) {
            ResponseWriter.unauthorized(res);
            return;
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
        };
        next();
    } catch (err) {
        console.error("auth middleware error: ", err);
        ResponseWriter.server_error(res);
    }
}
