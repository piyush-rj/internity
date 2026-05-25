import { Router, type Router as RouterType } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.ts";
import getAdminStats from "../controllers/admin-controllers/controller.admin.get_stats.ts";
import setUserBan from "../controllers/admin-controllers/controller.admin.set_user_ban.ts";

/**
 * Cross-cutting admin endpoints that don't naturally belong under
 * /company, /listing, or /employer:
 *   GET  /admin/stats           — platform overview counts
 *   POST /admin/user/:id/ban    — disable / reactivate a user account
 *
 * Per-resource admin endpoints stay under their resource routers (e.g.
 * /company/admin/list, /listing/admin/take-down).
 */
const router: RouterType = Router();
router.use(requireAuth);

router.get("/stats", requireAdmin, getAdminStats);
router.post("/user/:id/ban", requireAdmin, setUserBan);

export default router;
