import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import getMyEmployerProfile from "../controllers/employer-controllers/controller.employer.get_my_profile.ts";
import createMyEmployerProfile from "../controllers/employer-controllers/controller.employer.create_my_profile.ts";
import updateMyEmployerProfile from "../controllers/employer-controllers/controller.employer.update_my_profile.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.get("/me", getMyEmployerProfile);
router.post("/me", createMyEmployerProfile);
router.patch("/me", updateMyEmployerProfile);

export default router;
