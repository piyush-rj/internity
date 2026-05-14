import jwt from "jsonwebtoken";
import { ENV } from "../../config/config.env";
import type { UserRole } from "database";

export interface JWTPayload {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: UserRole;
}

export default class JwtServices {
    static assign_token(payload: JWTPayload): string {
        const token = jwt.sign(payload, ENV.SERVER_JWT_SECRET);
        return token;
    }

    static verify_token(token: string): JWTPayload | null {
        try {
            const decoded = jwt.verify(token, ENV.SERVER_JWT_SECRET);
            if (typeof decoded === "string") return null;
            return decoded as JWTPayload;
        } catch {
            return null;
        }
    }
}
