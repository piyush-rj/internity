import { Router } from "express";
import authRoutes from "./routes/routes.auth";
import studentRoutes from "./routes/routes.student";
import employerRoutes from "./routes/routes.employer";
import companyRoutes from "./routes/routes.company";
import listingRoutes from "./routes/routes.listing";
import applicationRoutes from "./routes/routes.application";
import savedRoutes from "./routes/routes.saved";
import chatRoutes from "./routes/routes.chat";
import uploadRoutes from "./routes/routes.upload";
import skillRoutes from "./routes/routes.skill";
import notificationRoutes from "./routes/routes.notification";
import paymentRoutes from "./routes/routes.payment";

const router = Router();

router.get("/health", (_req, res) => {
    res.json({ ok: true });
});

router.use("/auth", authRoutes);
router.use("/student", studentRoutes);
router.use("/employer", employerRoutes);
router.use("/company", companyRoutes);
router.use("/listing", listingRoutes);
router.use("/application", applicationRoutes);
router.use("/saved", savedRoutes);
router.use("/chat", chatRoutes);
router.use("/upload", uploadRoutes);
router.use("/skill", skillRoutes);
router.use("/notification", notificationRoutes);
router.use("/payment", paymentRoutes);

export default router;
