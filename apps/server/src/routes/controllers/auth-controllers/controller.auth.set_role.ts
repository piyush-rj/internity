import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ApiError, ResponseWriter } from "../../../utils/api-response.ts";
import { prisma, UserRole } from "../../../db.ts";

const Body = z.object({
    role: z.enum(["STUDENT", "EMPLOYER"]),
});

export default async function setRole(req: Request, res: Response): Promise<void> {
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
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        if (err instanceof ZodError) {
            const issue = err.issues[0];
            const where = issue?.path.join(".") || "body";
            api.invalidRequest(
                `Invalid ${where}: ${issue?.message ?? "invalid"}`,
            );
            return;
        }
        console.error(err);
        api.internalError();
    }
}
