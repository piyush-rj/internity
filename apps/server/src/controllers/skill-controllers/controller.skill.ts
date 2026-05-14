import type { Request, Response } from "express";
import z from "zod";
import { prisma } from "database";
import ResponseWriter from "../../class/response_writer";

export default class SkillController {
    static autocomplete_schema = z.object({
        q: z.string().min(1).max(50),
    });

    static async autocomplete(req: Request, res: Response) {
        const { data, success } = SkillController.autocomplete_schema.safeParse(
            req.query,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const items = await prisma.skill.findMany({
                where: { name: { startsWith: data.q.trim().toLowerCase() } },
                orderBy: { name: "asc" },
                take: 10,
            });
            ResponseWriter.success(res, { items });
        } catch (err) {
            console.error("skill.autocomplete:", err);
            ResponseWriter.server_error(res);
        }
    }
}
