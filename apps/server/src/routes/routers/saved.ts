import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import listSaved from "../controllers/saved-controllers/controller.saved.list_saved.ts";
import save from "../controllers/saved-controllers/controller.saved.save.ts";
import unsave from "../controllers/saved-controllers/controller.saved.unsave.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.get("/", listSaved);
router.post("/:listing_id", save);
router.delete("/:listing_id", unsave);

export default router;
