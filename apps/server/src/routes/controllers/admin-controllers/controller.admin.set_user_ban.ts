import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { NotificationType, prisma } from "../../../db.ts";
import { notify } from "../../../services/notifications.ts";

const Body = z.object({
    banned: z.boolean(),
    reason: z
        .string()
        .max(500, "Keep the reason under 500 characters")
        .optional(),
});

/**
 * Admin-only. Flips `User.isBanned` (with an optional `reason`) so the
 * target user is hard-blocked from the platform on their next request —
 * see middleware/auth.ts. Banning also hides their listings from public
 * surfaces via the postedBy.isBanned filter on the public listing
 * endpoints.
 *
 *   POST /admin/user/:id/ban     body: { banned: true,  reason: "..." }
 *   POST /admin/user/:id/ban     body: { banned: false }
 *
 * Notifies the affected user with a GENERIC notification documenting the
 * decision — they probably won't see it (they can't log in) but the audit
 * trail lives in the notifications table.
 */
export default async function setUserBan(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id;
        if (!id) throw new InvalidRequest("Missing user id");
        const body = Body.parse(req.body);

        // Don't let an admin ban themselves accidentally.
        if (req.user!.id === id) {
            throw new InvalidRequest("You can't disable your own account.");
        }
        if (body.banned && !body.reason?.trim()) {
            throw new InvalidRequest(
                "Add a short reason so the user knows what happened.",
            );
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, role: true },
        });
        if (!user) throw new NotFound("User not found");
        if (user.role === "ADMIN") {
            throw new InvalidRequest("Admins can't be banned from this UI.");
        }

        const now = new Date();
        const updated = await prisma.user.update({
            where: { id },
            data: body.banned
                ? {
                      isBanned: true,
                      banReason: body.reason!.trim(),
                      bannedAt: now,
                  }
                : {
                      isBanned: false,
                      banReason: null,
                      bannedAt: null,
                  },
            select: {
                id: true,
                isBanned: true,
                banReason: true,
                bannedAt: true,
            },
        });

        // Best-effort notification. They probably can't log in to see it
        // but it lives in the audit trail.
        if (body.banned) {
            await notify({
                userId: id,
                type: NotificationType.GENERIC,
                title: "Account disabled",
                body: body.reason!.trim(),
            });
        } else {
            await notify({
                userId: id,
                type: NotificationType.GENERIC,
                title: "Account reactivated",
                body: "An admin has restored your access. You can sign in again.",
            });
        }

        api.ok(
            { user: updated },
            body.banned ? "Account disabled" : "Account reactivated",
        );
    } catch (err) {
        if (err instanceof ZodError) {
            const issue = err.issues[0];
            api.invalidRequest(issue?.message ?? "Invalid request");
            return;
        }
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        handleApiError(err, api);
    }
}
