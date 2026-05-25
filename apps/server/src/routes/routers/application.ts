import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import listMyApplications from "../controllers/application-controllers/controller.application.list_mine.ts";
import getApplication from "../controllers/application-controllers/controller.application.get_application.ts";
import withdrawApplication from "../controllers/application-controllers/controller.application.withdraw.ts";
import updateApplicationStatus from "../controllers/application-controllers/controller.application.update_status.ts";
import applyBatch from "../controllers/application-controllers/controller.application.apply_batch.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.get("/mine", listMyApplications);
router.post("/batch", applyBatch);
router.get("/:id", getApplication);
router.delete("/:id", withdrawApplication);
router.patch("/:id/status", updateApplicationStatus);

export default router;
