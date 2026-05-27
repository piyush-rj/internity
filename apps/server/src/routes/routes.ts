import { Router, type Request, type Response } from "express";

import authRouter from "./routers/auth.ts";
import studentRouter from "./routers/student.ts";
import employerRouter from "./routers/employer.ts";
import companyRouter from "./routers/company.ts";
import listingRouter from "./routers/listing.ts";
import applicationRouter from "./routers/application.ts";
import savedRouter from "./routers/saved.ts";
import uploadRouter from "./routers/upload.ts";
import skillRouter from "./routers/skill.ts";
import notificationRouter from "./routers/notification.ts";
import paymentRouter from "./routers/payment.ts";
import chatRouter from "./routers/chat.ts";
import adminRouter from "./routers/admin.ts";
import interviewRouter from "./routers/interview.ts";
import invitationRouter from "./routers/invitation.ts";
import resumeRouter from "./routers/resume.ts";
import reportRouter from "./routers/report.ts";

const v1: Router = Router();

v1.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
});

v1.use("/auth", authRouter);
v1.use("/student", studentRouter);
v1.use("/employer", employerRouter);
v1.use("/company", companyRouter);
v1.use("/listing", listingRouter);
v1.use("/application", applicationRouter);
v1.use("/saved", savedRouter);
v1.use("/upload", uploadRouter);
v1.use("/skill", skillRouter);
v1.use("/notification", notificationRouter);
v1.use("/payment", paymentRouter);
v1.use("/chat", chatRouter);
v1.use("/admin", adminRouter);
v1.use("/interview", interviewRouter);
v1.use("/invitation", invitationRouter);
v1.use("/resume", resumeRouter);
v1.use("/report", reportRouter);

export default v1;
