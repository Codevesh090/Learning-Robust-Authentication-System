import express from "express";
import { getMeController, userRegisterController } from "../controller/auth.controller.js";
import { authmiddleware } from "../middlewares/auth.middleware.js";


export const authRouter = express.Router();

/* POST - /api/auth/register */
authRouter.post("/register", userRegisterController)

/* POST - /api/auth/get-me */
authRouter.post("/get-me",authmiddleware,getMeController)