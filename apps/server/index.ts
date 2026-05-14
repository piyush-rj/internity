import express from "express";
import router from "./src/router/routes";
import { ENV, parse_env } from "./src/config/config.env";
import cors from "cors";

parse_env();

const app = express();
app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    }),
);

app.use("/api/v1", router);

app.listen(ENV.SERVER_PORT, () => {
    console.log(`server running on port ${ENV.SERVER_PORT}`);
});
