import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import getMe from "../controllers/auth-controllers/controller.auth.get_me.ts";
import updateMe from "../controllers/auth-controllers/controller.auth.update_me.ts";
import setRole from "../controllers/auth-controllers/controller.auth.set_role.ts";
import switchActiveCompany from "../controllers/auth-controllers/controller.auth.switch_company.ts";
import deleteMyAccount from "../controllers/auth-controllers/controller.auth.delete_account.ts";

const router: RouterType = Router();

router.use(requireAuth);
router.get("/me", getMe);
router.patch("/me", updateMe);
router.post("/role", setRole);
router.post("/switch-company", switchActiveCompany);
router.delete("/me", deleteMyAccount);

export default router;
