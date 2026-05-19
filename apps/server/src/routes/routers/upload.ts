import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import signUpload from "../controllers/upload-controllers/controller.upload.sign.ts";
import confirmUpload from "../controllers/upload-controllers/controller.upload.confirm.ts";
import removeUpload from "../controllers/upload-controllers/controller.upload.remove.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.post("/sign", signUpload);
router.post("/confirm", confirmUpload);
router.delete("/:asset_id", removeUpload);

export default router;
