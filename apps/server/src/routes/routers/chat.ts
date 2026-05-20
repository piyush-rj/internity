import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import listConversations from "../controllers/chat-controllers/controller.chat.list_conversations.ts";
import listMessages from "../controllers/chat-controllers/controller.chat.list_messages.ts";
import markConversationRead from "../controllers/chat-controllers/controller.chat.mark_read.ts";
import startConversation from "../controllers/chat-controllers/controller.chat.start_conversation.ts";
import unreadCount from "../controllers/chat-controllers/controller.chat.unread_count.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.get("/conversations", listConversations);
router.post("/conversations", startConversation);
router.get("/conversations/:conversation_id/messages", listMessages);
router.post("/conversations/:conversation_id/read", markConversationRead);
router.get("/unread-count", unreadCount);

export default router;
