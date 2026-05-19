import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import listConversations from "../controllers/chat-controllers/controller.chat.list_conversations.ts";
import listMessages from "../controllers/chat-controllers/controller.chat.list_messages.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.get("/conversations", listConversations);
router.get("/conversations/:conversation_id/messages", listMessages);

export default router;
