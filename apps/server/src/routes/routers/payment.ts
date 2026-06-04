import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import createOrder from "../controllers/payment-controllers/controller.payment.create_order.ts";
import verifyPayment from "../controllers/payment-controllers/controller.payment.verify_payment.ts";
import listMyPayments from "../controllers/payment-controllers/controller.payment.list_mine.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.get("/mine", listMyPayments);
router.post("/order", createOrder);
router.post("/verify", verifyPayment);

export default router;
