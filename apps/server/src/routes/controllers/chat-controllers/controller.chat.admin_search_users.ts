import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function adminSearchUsers(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const q = ((req.query.q as string) ?? "").trim();
        if (!q) {
            api.ok({ users: [] });
            return;
        }

        const term = `%${q}%`;

        // Search students and employers by name / email / company name.
        // Raw query lets us do a single pass with the company join.
        const users = await prisma.$queryRaw<
            {
                id: string;
                name: string | null;
                email: string | null;
                image: string | null;
                role: string;
                companyName: string | null;
                conversationId: string | null;
            }[]
        >`
            SELECT
                u.id,
                u.name,
                u.email,
                u.image,
                u.role,
                c.name AS "companyName",
                conv.id AS "conversationId"
            FROM "User" u
            LEFT JOIN "CompanyMember" cm ON cm."userId" = u.id
            LEFT JOIN "Company" c ON c.id = cm."companyId"
            LEFT JOIN "Conversation" conv
                ON conv."studentId" = u.id
                AND conv."recruiterId" = u.id
                AND conv."isAdminThread" = true
            WHERE
                u.role IN ('STUDENT', 'EMPLOYER')
                AND u."deletedAt" IS NULL
                AND (
                    u.name    ILIKE ${term}
                    OR u.email ILIKE ${term}
                    OR c.name  ILIKE ${term}
                )
            ORDER BY u.name ASC NULLS LAST
            LIMIT 15
        `;

        api.ok({ users });
    } catch (err) {
        handleApiError(err, api);
    }
}
