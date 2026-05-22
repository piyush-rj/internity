import express from "express";
import "express-async-errors";
import cors from "cors";
import { createServer } from "node:http";
import { config } from "./config/config.ts";
import { prisma } from "./db.ts";
import { ChatSocket } from "./socket/socket.chat.ts";
import { errorHandler } from "./middleware/error.ts";
import v1 from "./routes/routes.ts";

const app = express();
const server = createServer(app);

// Render/Vercel/etc. terminate TLS at a reverse proxy. Without this, req.ip
// reports the proxy and req.protocol stays "http" behind HTTPS.
app.set("trust proxy", 1);

app.use(express.json({ limit: "1mb" }));
app.use(
    cors({
        origin: config.CORS_ORIGIN,
        credentials: true,
    }),
);

app.use("/api/v1", v1);
app.use(errorHandler);

new ChatSocket(server, "/api/v1/chat/ws");

// Reset any presence rows the connection manager doesn't know about — a
// previous process crash leaves them stuck at isOnline=true otherwise.
// In-memory presence is authoritative; we only persist it for the chat
// header's last-seen UI.
prisma.user
    .updateMany({
        where: { isOnline: true },
        data: { isOnline: false, lastSeenAt: new Date() },
    })
    .catch((err) => console.error("startup presence reset failed:", err));

server.listen(config.SERVER_PORT, () => {
    console.log(`server listening on ${config.SERVER_PORT}`);
});
