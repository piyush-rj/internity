import { Router } from "express";
import auth_middleware from "../../middleware/middleware.auth";
import PaymentController from "../../controllers/payment-controllers/controller.payment";

const paymentRoutes = Router();

paymentRoutes.post("/order", auth_middleware, PaymentController.create_order);
paymentRoutes.post("/verify", auth_middleware, PaymentController.verify);

export default paymentRoutes;
