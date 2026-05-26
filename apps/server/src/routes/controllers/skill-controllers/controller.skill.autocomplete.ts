import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function autocompleteSkill(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const q = String(req.query.q ?? "")
            .trim()
            .toLowerCase();
        if (!q || q.length > 50) {
            api.ok({ items: [] });
            return;
        }
        const items = await prisma.skill.findMany({
            where: { name: { startsWith: q } },
            orderBy: { name: "asc" },
            take: 10,
        });
        api.ok({ items });
    } catch (err) {
        handleApiError(err, api);
    }
}
