import type { Request, Response } from "express";
import {
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function adminInitiateConversation(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const userId = req.params.userId as string;

        const target = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, deletedAt: true },
        });

        if (!target || target.deletedAt) {
            throw new NotFound("User not found");
        }

        if (target.role === "ADMIN") {
            throw new InvalidRequest("Cannot open an admin thread with another admin");
        }

        // Mirror the same upsert logic as start_admin_conversation:
        // studentId === recruiterId === the non-admin user's id.
        const conversation = await prisma.conversation.upsert({
            where: {
                studentId_recruiterId: {
                    studentId: userId,
                    recruiterId: userId,
                },
            },
            create: {
                studentId: userId,
                recruiterId: userId,
                isAdminThread: true,
            },
            update: {},
            select: { id: true },
        });

        api.ok({ id: conversation.id });
    } catch (err) {
        handleApiError(err, api);
    }
}
