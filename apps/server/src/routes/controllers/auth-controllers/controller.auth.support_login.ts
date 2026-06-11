import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { isSupportAgentEnabled } from "../../../config/config.ts";
import {
    checkSupportAgentCredentials,
    ensureSupportAgentUser,
} from "../../../services/support-agent.ts";
import { mintSupportAgentToken } from "../../../core/support-token.ts";

const bodySchema = z.object({
    email: z.string().trim().min(1, "Email is required"),
    password: z.string().min(1, "Password is required"),
});

// Public endpoint: logs in the single hardcoded support-agent identity with
// email + password and returns a bearer token usable on every authed route.
export default async function supportLogin(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        if (!isSupportAgentEnabled) {
            api.fail(
                503,
                "SUPPORT_LOGIN_DISABLED",
                "Support login is not enabled.",
            );
            return;
        }

        const { email, password } = bodySchema.parse(req.body);

        if (!checkSupportAgentCredentials(email, password)) {
            api.fail(401, "INVALID_CREDENTIALS", "Invalid email or password.");
            return;
        }

        const user = await ensureSupportAgentUser();
        const token = await mintSupportAgentToken(user.id);

        api.ok({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: "ADMIN" as const,
            },
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
