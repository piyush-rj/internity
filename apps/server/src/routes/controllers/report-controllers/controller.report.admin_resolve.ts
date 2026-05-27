import type { Request, Response } from "express";
import { z } from "zod";
import {
    Forbidden,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma, ReportStatus } from "../../../db.ts";
import { isAdminUser } from "../../../config/config.ts";

const Body = z.object({
    status: z.enum(["RESOLVED", "DISMISSED"]),
    note: z.string().max(2000).optional(),
});

export default async function adminResolveReport(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        if (!isAdminUser(req.user!)) throw new Forbidden("Admin only");
        const id = req.params.id as string;
        const body = Body.parse(req.body);

        const found = await prisma.report.findUnique({ where: { id } });
        if (!found) throw new NotFound();

        const updated = await prisma.report.update({
            where: { id },
            data: {
                status: body.status as ReportStatus,
                resolvedById: req.user!.id,
                resolvedAt: new Date(),
                resolutionNote: body.note ?? null,
            },
        });
        api.ok({ report: updated }, "Report updated");
    } catch (err) {
        handleApiError(err, api);
    }
}
