import { Router, type Router as RouterType } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.ts";
import getAdminStats from "../controllers/admin-controllers/controller.admin.get_stats.ts";
import listPayments from "../controllers/admin-controllers/controller.admin.list_payments.ts";
import setUserBan from "../controllers/admin-controllers/controller.admin.set_user_ban.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.get("/stats", requireAdmin, getAdminStats);
router.get("/payments", requireAdmin, listPayments);
router.post("/user/:id/ban", requireAdmin, setUserBan);

export default router;
