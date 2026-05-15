import crypto from "node:crypto";
import type { Request, Response } from "express";
import Razorpay from "razorpay";
import z from "zod";
import ResponseWriter from "../../class/response_writer";

const keyId = process.env.RAZORPAY_KEY_ID ?? "";
const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";

const razorpay =
    keyId && keySecret
        ? new Razorpay({ key_id: keyId, key_secret: keySecret })
        : null;

export default class PaymentController {
    static order_schema = z.object({
        amount: z.number().int().positive(), // in paise
        currency: z.string().default("INR"),
    });

    static verify_schema = z.object({
        razorpay_order_id: z.string().min(1),
        razorpay_payment_id: z.string().min(1),
        razorpay_signature: z.string().min(1),
    });

    // POST /payment/order — creates a Razorpay order so the client can open checkout
    static async create_order(req: Request, res: Response) {
        if (!razorpay) {
            ResponseWriter.server_error(
                res,
                "Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
            );
            return;
        }
        const { data, success } = PaymentController.order_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const order = await razorpay.orders.create({
                amount: data.amount,
                currency: data.currency,
                receipt: `r_${req.user!.id}_${Date.now()}`,
                notes: { userId: req.user!.id },
            });
            ResponseWriter.success(res, {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId,
            });
        } catch (err) {
            console.error("payment.create_order:", err);
            ResponseWriter.server_error(res);
        }
    }

    // POST /payment/verify — verifies the signature returned by Razorpay checkout
    static async verify(req: Request, res: Response) {
        if (!keySecret) {
            ResponseWriter.server_error(res, "Payment gateway not configured.");
            return;
        }
        const { data, success } = PaymentController.verify_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        const expected = crypto
            .createHmac("sha256", keySecret)
            .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
            .digest("hex");
        if (expected !== data.razorpay_signature) {
            ResponseWriter.invalid_data(res, "Invalid payment signature");
            return;
        }
        ResponseWriter.success(res, { ok: true });
    }
}
