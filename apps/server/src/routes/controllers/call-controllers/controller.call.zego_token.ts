import type { Request, Response } from "express";
import { z } from "zod";
import { zegoUserIdFor } from "types";
import { ResponseWriter } from "../../../utils/api-response.ts";
import { config } from "../../../config/config.ts";
import { generateZegoToken04 } from "../../../services/zego-token.ts";

// 24 hours — Zego's documented max. The client doesn't (yet) wire
// onTokenWillExpire+renewToken, so a long TTL keeps "user opens dashboard
// at 9am, calls at 5pm" from failing with an auth error. Re-evaluate if
// we ever ship explicit token renewal.
const TOKEN_TTL_SECONDS = 60 * 60 * 24;

const Body = z.object({
    /** Stable room id for the call; both parties join the same one. */
    roomId: z.string().min(1).max(128),
});

export type ZegoTokenResponse = {
    appId: number;
    token: string;
    userId: string;
    userName: string;
    roomId: string;
    /** Seconds until the token expires. */
    expiresIn: number;
};

export default async function zegoToken(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    const me = req.user!;

    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
        api.invalidRequest("roomId is required");
        return;
    }

    if (!config.ZEGO_APP_ID || !config.ZEGO_SERVER_SECRET) {
        api.fail(
            503,
            "CALLING_NOT_CONFIGURED",
            "Voice calling is not configured on this server.",
        );
        return;
    }

    // Zego's userID has a length limit our internal ids can violate; hash
    // to a stable 17-char form via the shared helper so client + server
    // agree on the same id without an extra round-trip.
    const zegoUserId = zegoUserIdFor(me.id);
    const token = generateZegoToken04({
        appId: config.ZEGO_APP_ID,
        userId: zegoUserId,
        serverSecret: config.ZEGO_SERVER_SECRET,
        effectiveTimeInSeconds: TOKEN_TTL_SECONDS,
    });

    const body: ZegoTokenResponse = {
        appId: config.ZEGO_APP_ID,
        token,
        userId: zegoUserId,
        userName: me.name ?? me.email ?? "User",
        roomId: parsed.data.roomId,
        expiresIn: TOKEN_TTL_SECONDS,
    };
    api.ok(body);
}
