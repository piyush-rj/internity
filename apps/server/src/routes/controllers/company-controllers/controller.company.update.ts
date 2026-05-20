import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    name: z.string().min(1).optional(),
    logoUrl: z.string().url().nullable().optional(),
    website: z.string().url().nullable().optional(),
    about: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
    size: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
});

export default async function updateCompany(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const id = req.params.id as string;
        const c = await prisma.company.findUnique({ where: { id } });
        if (!c) throw new NotFound();
        const data: Record<string, unknown> = {};
        if (body.name !== undefined) data.name = body.name;
        if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl;
        if (body.website !== undefined) data.website = body.website;
        if (body.about !== undefined) data.about = body.about;
        if (body.industry !== undefined) data.industry = body.industry;
        if (body.size !== undefined) data.size = body.size;
        if (body.city !== undefined) data.city = body.city;
        const updated = await prisma.company.update({
            where: { id },
            data,
        });
        api.ok({ company: updated });
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
