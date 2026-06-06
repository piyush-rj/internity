import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function revokeOffer(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const { id } = req.params;
        const adminId = req.user!.id;

        const offer = await prisma.offer.findUnique({ where: { id } });
        if (!offer) {
            api.notFound();
            return;
        }
        if (!offer.isActive) {
            api.fail(409, "ALREADY_REVOKED", "This offer is already revoked.");
            return;
        }

        const updated = await prisma.offer.update({
            where: { id },
            data: {
                isActive: false,
                revokedAt: new Date(),
                revokedById: adminId,
            },
        });

        api.ok({ offer: { id: updated.id, isActive: updated.isActive } });
    } catch (err) {
        handleApiError(err, api);
    }
}
