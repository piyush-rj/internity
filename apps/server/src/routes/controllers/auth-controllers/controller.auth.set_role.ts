import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma, UserRole } from "../../../db.ts";
import { sendWelcomeMessage } from "../../../services/welcome-message.ts";

const Body = z.object({
    role: z.enum(["STUDENT", "EMPLOYER"]),
});

export default async function setRole(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);

        // Read the prior state so we can fire the one-time welcome message
        // only on the first onboarding (roleConfirmed flipping false -> true),
        // never on a later role change.
        const before = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: { roleConfirmed: true },
        });

        const updated = await prisma.user.update({
            where: { id: req.user!.id },
            data: { role: body.role as UserRole, roleConfirmed: true },
            select: { role: true, roleConfirmed: true },
        });

        if (!before?.roleConfirmed) {
            await sendWelcomeMessage(req.user!.id, body.role);
        }

        api.ok(updated, "Role updated");
    } catch (err) {
        handleApiError(err, api);
    }
}
