import express from "express";
import morgan from "morgan";
import { authRouter } from "./routes/auth.router.js";
import cookieParser from "cookie-parser";
export const app = express();
app.use(express.json());
app.use(morgan("dev")); // It logs information(status code , request method , response time etc ..)about every HTTP request that reaches your Express server .
app.use(cookieParser());
app.use("/api/auth", authRouter);
//# sourceMappingURL=app.js.map