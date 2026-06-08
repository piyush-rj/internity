import type { Request, Response } from "express";
import { z } from "zod";
import {
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { Prisma, prisma } from "../../../db.ts";

const Body = z.object({
    title: z.string().max(120).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
});

export default async function updateDraft(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);

        // Scope the update to the caller's own draft so one user can't touch
        // another's. updateMany returns a count rather than throwing on miss.
        const result = await prisma.listingDraft.updateMany({
            where: { id: req.params.id, userId: req.user!.id },
            data: {
                ...(body.title !== undefined
                    ? { title: body.title.trim() || "Untitled draft" }
                    : {}),
                ...(body.data !== undefined
                    ? { data: body.data as Prisma.InputJsonValue }
                    : {}),
            },
        });
        if (result.count === 0) throw new NotFound("Draft not found");

        const draft = await prisma.listingDraft.findUnique({
            where: { id: req.params.id },
        });
        api.ok({ draft }, "Draft saved");
    } catch (err) {
        handleApiError(err, api);
    }
}
