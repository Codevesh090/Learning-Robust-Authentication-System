import type{ Request,Response,NextFunction } from "express";
import { StatusCode } from "../constants/statusCodes.constant.js";
import jwt from "jsonwebtoken";
import config from "../config/env.config.js";

interface JwtPayload {
  userId : string
}


export async function authmiddleware(req:Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(StatusCode.UNAUTHORIZED).json({
        message: "Invalid token"
      });
      return;
    }

    const decoded = jwt.verify(token, config.SECRET_KEY) as JwtPayload; // decoded is of type JwtPayload

    if (typeof decoded.userId !== "string") {
      res.status(StatusCode.UNAUTHORIZED).json({
        message: "Invalid token payload",
      });
      return;
    }

    req.userId = decoded.userId;

    next();
  } catch (err) {
    res.status(StatusCode.UNAUTHORIZED).json({
      message: "Invalid or expired token"
    });
    return;
  }
}