import express from "express";
import "express-async-errors";
import cors from "cors";
import { createServer } from "node:http";
import { config, isSupportAgentEnabled } from "./config/config.ts";
import { prisma } from "./db.ts";
import { ChatSocket } from "./socket/socket.chat.ts";
import { errorHandler } from "./middleware/error.ts";
import { ensureSupportAgentUser } from "./services/support-agent.ts";
import v1 from "./routes/routes.ts";

const app = express();
const server = createServer(app);

app.set("trust proxy", 1);

app.use(express.json({ limit: "1mb" }));

const allowedOrigins = new Set(
    config.CORS_ORIGIN.split(",")
        .map((o) => o.trim().replace(/\/$/, ""))
        .filter(Boolean),
);

app.use(
    cors({
        origin(origin, cb) {
            if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
                cb(null, true);
                return;
            }
            cb(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
    }),
);

app.use("/api/v1", v1);
app.use(errorHandler);

new ChatSocket(server, "/api/v1/chat/ws");

prisma.user
    .updateMany({
        where: { isOnline: true },
        data: { isOnline: false, lastSeenAt: new Date() },
    })
    .catch((err) => console.error("startup presence reset failed:", err));

// Provision the hardcoded support-agent User row so its chat messages have a
// valid sender and support threads route to it. No-op when not configured.
if (isSupportAgentEnabled) {
    ensureSupportAgentUser().catch((err) =>
        console.error("support agent provisioning failed:", err),
    );
}

server.listen(config.SERVER_PORT, "0.0.0.0", () => {
    console.log(`server listening on 0.0.0.0:${config.SERVER_PORT}`);
});
