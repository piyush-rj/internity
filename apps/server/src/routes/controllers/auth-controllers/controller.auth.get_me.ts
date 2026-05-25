import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";
import { isAdminUser } from "../../../config/config.ts";

export default async function getMe(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: {
                studentProfile: { select: { id: true } },
                employerProfile: { select: { id: true } },
            },
        });
        if (!user) {
            api.notFound();
            return;
        }
        api.ok({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            image: user.image,
            role: user.role,
            roleConfirmed: user.roleConfirmed,
            isAdmin: isAdminUser({ role: user.role, email: user.email }),
            isPremium: user.isPremium,
            needsOnboarding: !user.name || user.name.trim().length === 0,
            hasStudentProfile: user.studentProfile !== null,
            hasEmployerProfile: user.employerProfile !== null,
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
