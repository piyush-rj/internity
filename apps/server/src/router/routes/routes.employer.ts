import { Router } from "express";
import auth_middleware from "../../middleware/middleware.auth";
import EmployerProfileController from "../../controllers/employer-controllers/controller.profile";

const employerRoutes = Router();

employerRoutes.get(
    "/me",
    auth_middleware,
    EmployerProfileController.get_my_profile,
);
employerRoutes.post(
    "/me",
    auth_middleware,
    EmployerProfileController.create_my_profile,
);
employerRoutes.patch(
    "/me",
    auth_middleware,
    EmployerProfileController.update_my_profile,
);

export default employerRoutes;
