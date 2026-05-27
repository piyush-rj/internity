import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import listMyResumes from "../controllers/resume-controllers/controller.resume.list_mine.ts";
import setDefaultResume from "../controllers/resume-controllers/controller.resume.set_default.ts";
import deleteResume from "../controllers/resume-controllers/controller.resume.delete.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.get("/", listMyResumes);
router.post("/:id/default", setDefaultResume);
router.delete("/:id", deleteResume);

export default router;
