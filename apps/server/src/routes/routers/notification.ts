import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import listMyNotifications from "../controllers/notification-controllers/controller.notification.list_mine.ts";
import markNotificationRead from "../controllers/notification-controllers/controller.notification.mark_read.ts";
import markAllNotificationsRead from "../controllers/notification-controllers/controller.notification.mark_all_read.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.get("/", listMyNotifications);
router.patch("/:id/read", markNotificationRead);
router.post("/read-all", markAllNotificationsRead);

export default router;
