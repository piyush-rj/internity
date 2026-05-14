import { Router } from "express";
import auth_middleware from "../../middleware/middleware.auth";
import UserRegistration from "../../controllers/user-controllers/controller.sign-in";
import AuthMe from "../../controllers/user-controllers/controller.me";

const authRoutes = Router();

authRoutes.post("/sign-in", UserRegistration.process_login);
authRoutes.get("/me", auth_middleware, AuthMe.get_me);
authRoutes.post("/role", auth_middleware, AuthMe.set_role);

export default authRoutes;
