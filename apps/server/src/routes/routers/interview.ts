import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import scheduleInterview from "../controllers/interview-controllers/controller.interview.schedule.ts";
import listMyInterviews from "../controllers/interview-controllers/controller.interview.list_mine.ts";
import cancelInterview from "../controllers/interview-controllers/controller.interview.cancel.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.post("/", scheduleInterview);
router.get("/mine", listMyInterviews);
router.post("/:id/cancel", cancelInterview);

export default router;
