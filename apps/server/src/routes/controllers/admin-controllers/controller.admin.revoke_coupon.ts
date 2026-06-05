import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function revokeCoupon(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const { id } = req.params;
        const adminId = req.user!.id;

        const coupon = await prisma.coupon.findUnique({ where: { id } });
        if (!coupon) {
            api.notFound();
            return;
        }
        if (!coupon.isActive) {
            api.fail(409, "ALREADY_REVOKED", "This coupon is already revoked.");
            return;
        }

        const updated = await prisma.coupon.update({
            where: { id },
            data: {
                isActive: false,
                revokedAt: new Date(),
                revokedById: adminId,
            },
        });

        api.ok({ coupon: { id: updated.id, isActive: updated.isActive } });
    } catch (err) {
        handleApiError(err, api);
    }
}
