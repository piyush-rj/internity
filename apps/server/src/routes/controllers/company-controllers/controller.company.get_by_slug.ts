import type { Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError, NotFound, ResponseWriter } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function getCompanyBySlug(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const c = await prisma.company.findUnique({
            where: { slug: req.params.slug as string },
        });
        if (!c) throw new NotFound();
        const listings = await prisma.listing.findMany({
            where: { companyId: c.id, closedAt: null },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { company: true },
        });
        api.ok({ company: { ...c, listings } });
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
