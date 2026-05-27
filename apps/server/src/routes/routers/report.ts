import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import createReport from "../controllers/report-controllers/controller.report.create.ts";
import adminListReports from "../controllers/report-controllers/controller.report.admin_list.ts";
import adminResolveReport from "../controllers/report-controllers/controller.report.admin_resolve.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.post("/", createReport);
router.get("/admin", adminListReports);
router.post("/admin/:id/resolve", adminResolveReport);

export default router;
