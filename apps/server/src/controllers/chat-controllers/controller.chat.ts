import type { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../class/response_writer";

export default class ChatController {
    static send_schema = z.object({
        text: z.string().min(1),
    });

    // GET /chat/conversations — applications the caller has messages in
    static async list_conversations(_req: Request, res: Response) {
        // TODO: aggregate messages by applicationId where senderId or receiverId === me, include latest message + unread count
        ResponseWriter.success(res, null, "not implemented");
    }

    // GET /chat/application/:id/messages — paginated history
    static async list_messages(_req: Request, res: Response) {
        // TODO: assert caller is applicant OR CompanyMember of listing.companyId, prisma.message.findMany cursor pagination
        ResponseWriter.success(res, null, "not implemented");
    }

    // POST /chat/application/:id/messages — send (sockets layer will also emit)
    static async send(req: Request, res: Response) {
        const parsed = ChatController.send_schema.safeParse(req.body);
        if (!parsed.success) return ResponseWriter.invalid_data(res);
        // TODO: derive receiverId from application (applicant vs posted company member), prisma.message.create
        ResponseWriter.success(res, null, "not implemented");
    }

    // POST /chat/application/:id/messages/read — mark unread received messages as read
    static async mark_read(_req: Request, res: Response) {
        // TODO: prisma.message.updateMany({ where: { applicationId, receiverId: req.user.id, readAt: null }, data: { readAt: new Date() } })
        ResponseWriter.success(res, null, "not implemented");
    }
}
