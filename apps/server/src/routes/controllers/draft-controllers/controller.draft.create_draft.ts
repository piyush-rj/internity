import type { Request, Response } from "express";
import { z } from "zod";
import {
    InvalidRequest,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { Prisma, prisma } from "../../../db.ts";

// A founder may keep at most this many drafts at once.
const MAX_DRAFTS = 10;

const Body = z.object({
    title: z.string().max(120).optional(),
    companyId: z.string().min(1).nullable().optional(),
    // The post-listing form state — intentionally an opaque JSON blob since a
    // draft can be partial / not a valid listing yet.
    data: z.record(z.string(), z.unknown()),
});

export default async function createDraft(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);

        const count = await prisma.listingDraft.count({
            where: { userId: req.user!.id },
        });
        if (count >= MAX_DRAFTS) {
            throw new InvalidRequest(
                `You can keep up to ${MAX_DRAFTS} drafts. Delete one to save another.`,
            );
        }

        const draft = await prisma.listingDraft.create({
            data: {
                userId: req.user!.id,
                companyId: body.companyId ?? null,
                title: body.title?.trim() || "Untitled draft",
                data: body.data as Prisma.InputJsonValue,
            },
        });
        api.created({ draft }, "Draft saved");
    } catch (err) {
        handleApiError(err, api);
    }
}
