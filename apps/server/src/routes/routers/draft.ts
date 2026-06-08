import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import listDrafts from "../controllers/draft-controllers/controller.draft.list_drafts.ts";
import getDraft from "../controllers/draft-controllers/controller.draft.get_draft.ts";
import createDraft from "../controllers/draft-controllers/controller.draft.create_draft.ts";
import updateDraft from "../controllers/draft-controllers/controller.draft.update_draft.ts";
import deleteDraft from "../controllers/draft-controllers/controller.draft.delete_draft.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.get("/", listDrafts);
router.post("/", createDraft);
router.get("/:id", getDraft);
router.patch("/:id", updateDraft);
router.delete("/:id", deleteDraft);

export default router;
