import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import createOrder from "../controllers/payment-controllers/controller.payment.create_order.ts";
import verifyPayment from "../controllers/payment-controllers/controller.payment.verify_payment.ts";
import listMyPayments from "../controllers/payment-controllers/controller.payment.list_mine.ts";
import cancelRequest from "../controllers/payment-controllers/controller.payment.cancel_request.ts";
import validateCoupon from "../controllers/payment-controllers/controller.payment.validate_coupon.ts";
import getActiveOffer from "../controllers/payment-controllers/controller.payment.get_active_offer.ts";

const router: RouterType = Router();
router.use(requireAuth);

router.get("/mine", listMyPayments);
router.post("/order", createOrder);
router.post("/verify", verifyPayment);
router.post("/cancel-request", cancelRequest);
router.post("/coupon/validate", validateCoupon);
router.get("/offer/active", getActiveOffer);

export default router;
