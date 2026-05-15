import { Router } from "express";
import auth_middleware from "../../middleware/middleware.auth";
import NotificationController from "../../controllers/notification-controllers/controller.notification";

const notificationRoutes = Router();

notificationRoutes.get("/", auth_middleware, NotificationController.list_mine);
notificationRoutes.patch(
    "/:id/read",
    auth_middleware,
    NotificationController.mark_read,
);
notificationRoutes.post(
    "/read-all",
    auth_middleware,
    NotificationController.mark_all_read,
);

export default notificationRoutes;
