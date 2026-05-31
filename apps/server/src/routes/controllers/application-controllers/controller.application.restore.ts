import type { Request, Response } from "express";
import {
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { ApplicationStatus, prisma } from "../../../db.ts";

// Restores a previously withdrawn ("recently deleted") application back to
// APPLIED, so a student can recover one they withdrew by mistake. Mirrors the
// acceptance checks used by the apply flow — a listing that is closed, taken
// down, paused, or expired no longer accepts applications, so we refuse to
// resurrect into it rather than leave the founder with a zombie applicant.
export default async function restoreApplication(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const application = await prisma.application.findFirst({
            where: { id: req.params.id as string, studentId: req.user!.id },
            select: {
                id: true,
                status: true,
                listing: {
                    select: {
                        closedAt: true,
                        takenDownAt: true,
                        pausedAt: true,
                        expiresAt: true,
                    },
                },
            },
        });
        if (!application) throw new NotFound();

        if (application.status !== ApplicationStatus.WITHDRAWN) {
            throw new InvalidRequest(
                "Only withdrawn applications can be restored.",
            );
        }

        const l = application.listing;
        const now = Date.now();
        const notAccepting =
            !!l.takenDownAt ||
            !!l.closedAt ||
            !!l.pausedAt ||
            (l.expiresAt != null && l.expiresAt.getTime() <= now);
        if (notAccepting) {
            throw new InvalidRequest(
                "This internship is no longer accepting applications.",
            );
        }

        const updated = await prisma.application.update({
            where: { id: application.id },
            data: {
                status: ApplicationStatus.APPLIED,
                statusUpdatedAt: new Date(),
            },
        });
        api.ok({ application: updated });
    } catch (err) {
        handleApiError(err, api);
    }
}
