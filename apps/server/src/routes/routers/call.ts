import { Router, type Router as RouterType } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.ts";
import zegoToken from "../controllers/call-controllers/controller.call.zego_token.ts";

const router: RouterType = Router();
router.use(requireAuth);

// Only EMPLOYER accounts may mint call tokens — students join an in-progress
// call from the invitation modal, which calls the same endpoint but with
// their own auth (so we don't block them here, just gate initiation in UI).
router.post("/zego-token", requireRole("EMPLOYER", "STUDENT"), zegoToken);

export default router;
