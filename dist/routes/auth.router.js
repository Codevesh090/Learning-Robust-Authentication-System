import express from "express";
import { getMeController, userRegisterController } from "../controllers/auth.controller.js";
import { authmiddleware } from "../middlewares/auth.middleware.js";
import { refreshTokenController } from "../controllers/auth.controller.js";
"";
export const authRouter = express.Router();
/* POST - /api/auth/register */
authRouter.post("/register", userRegisterController);
/* GET - /api/auth/get-me */
authRouter.get("/get-me", authmiddleware, getMeController);
/* GET - /api/auth/refresh-token */
authRouter.get("/refresh-token", refreshTokenController);
//# sourceMappingURL=auth.router.js.map