import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { config } from "./config/config.ts";
import { ChatSocket } from "./socket/socket.chat.ts";
import v1 from "./routes/routes.ts";

const app = express();
const server = createServer(app);

app.use(express.json({ limit: "1mb" }));
app.use(
    cors({
        origin: config.CORS_ORIGIN,
        credentials: true,
    }),
);

app.use("/api/v1", v1);

new ChatSocket(server, "/api/v1/chat/ws");

server.listen(config.SERVER_PORT, () => {
    console.log(`server listening on ${config.SERVER_PORT}`);
});
