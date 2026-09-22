import express from "express";
import { getMeController, logoutAllController, logoutController, sendVerificationOtpController, userLoginController, userRegisterController, verifyOtpController } from "../controllers/auth.controller.js";
import { authmiddleware } from "../middlewares/auth.middleware.js";
import { refreshTokenController } from "../controllers/auth.controller.js"; "";


export const authRouter = express.Router();

/* POST - /api/auth/register */
authRouter.post("/register", userRegisterController)

/* POST - /api/auth/register */
authRouter.post("/login", userLoginController)

/* GET - /api/auth/get-me */
authRouter.get("/get-me", authmiddleware, getMeController)

/* GET - /api/auth/refresh-token */
authRouter.get("/refresh-token", refreshTokenController)

/* GET - /api/auth/log-out */
authRouter.get("/log-out", logoutController)

/* GET - /api/auth/logout-all */
authRouter.get("/logout-all", logoutAllController)

/* POST - /api/auth/sendVerificatioOtp */
authRouter.post("/sendVerificationOtp", sendVerificationOtpController)

/* POST - /api/auth/verifyOtp */
authRouter.post("/verifyOtp", verifyOtpController)