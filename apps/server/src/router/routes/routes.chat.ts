import { Router } from "express";
import auth_middleware from "../../middleware/middleware.auth";
import ChatController from "../../controllers/chat-controllers/controller.chat";

const chatRoutes = Router();

chatRoutes.get(
    "/conversations",
    auth_middleware,
    ChatController.list_conversations,
);
chatRoutes.get(
    "/application/:id/messages",
    auth_middleware,
    ChatController.list_messages,
);
chatRoutes.post(
    "/application/:id/messages",
    auth_middleware,
    ChatController.send,
);
chatRoutes.post(
    "/application/:id/messages/read",
    auth_middleware,
    ChatController.mark_read,
);

export default chatRoutes;
