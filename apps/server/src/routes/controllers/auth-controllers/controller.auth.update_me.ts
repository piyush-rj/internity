import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    name: z.string().min(1).max(200).optional(),
});

export default async function updateMe(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);

        const updates: { name?: string } = {};
        if (body.name !== undefined) updates.name = body.name.trim();

        const updated = await prisma.user.update({
            where: { id: req.user!.id },
            data: updates,
            include: {
                studentProfile: { select: { id: true } },
                employerProfile: { select: { id: true } },
            },
        });

        api.ok(
            {
                id: updated.id,
                name: updated.name,
                email: updated.email,
                phone: updated.phone,
                image: updated.image,
                role: updated.role,
                roleConfirmed: updated.roleConfirmed,
                isPremium: updated.isPremium,
                needsOnboarding:
                    !updated.name || updated.name.trim().length === 0,
                hasStudentProfile: updated.studentProfile !== null,
                hasEmployerProfile: updated.employerProfile !== null,
            },
            "Profile updated",
        );
    } catch (err) {
        handleApiError(err, api);
    }
}
