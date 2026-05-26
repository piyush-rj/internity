import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import getCompanyInvitation from "../controllers/company-controllers/controller.company.get_invitation.ts";
import acceptCompanyInvitation from "../controllers/company-controllers/controller.company.accept_invitation.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.get("/:token", getCompanyInvitation);
router.post("/:token/accept", acceptCompanyInvitation);

export default router;
