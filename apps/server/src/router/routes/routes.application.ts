import { Router } from "express";
import auth_middleware from "../../middleware/middleware.auth";
import ApplicationController from "../../controllers/application-controllers/controller.application";

const applicationRoutes = Router();

applicationRoutes.get(
    "/mine",
    auth_middleware,
    ApplicationController.list_mine,
);
applicationRoutes.get("/:id", auth_middleware, ApplicationController.get);
applicationRoutes.delete(
    "/:id",
    auth_middleware,
    ApplicationController.withdraw,
);
applicationRoutes.patch(
    "/:id/status",
    auth_middleware,
    ApplicationController.update_status,
);

export default applicationRoutes;
