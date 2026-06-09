import type { Request, Response } from "express";
import {
    InvalidRequest,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

// idempotently starts or returns the shared admin thread for the caller.
// any non-admin user can call this; admins have no need to initiate.
export default async function startAdminConversation(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const userId = req.user!.id;

        if (req.user!.role === "ADMIN") {
            throw new InvalidRequest("Admins do not initiate admin threads");
        }

        // For admin threads studentId === recruiterId === the non-admin user.
        // The @@unique([studentId, recruiterId]) constraint makes this idempotent.
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
