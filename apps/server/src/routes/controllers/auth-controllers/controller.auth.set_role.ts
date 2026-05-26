import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma, UserRole } from "../../../db.ts";

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
        const updated = await prisma.user.update({
            where: { id: req.user!.id },
            data: { role: body.role as UserRole, roleConfirmed: true },
            select: { role: true, roleConfirmed: true },
        });
        api.ok(updated, "Role updated");
    } catch (err) {
        handleApiError(err, api);
    }
}
