import express from "express";
import { userRegisterController } from "../controller/auth.controller.js";


export const authRouter = express.Router();

/* POST - /api/auth/register */
authRouter.post("/register",userRegisterController)