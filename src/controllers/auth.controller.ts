import type { Request, Response } from "express";
import { userModel } from "../models/user.model.js";
import { StatusCode } from "../constants/statusCodes.constant.js";
import jwt from "jsonwebtoken";
import config from "../config/env.config.js";
import { hashPassword } from "../utils/password.utils.js";
import { strict } from "assert";
import crypto from "node:crypto";
import { sessionModel } from "../models/session.model.js";

interface JwtPayload {
  userId : string
}

export async function userRegisterController(req:Request,res:Response):Promise<void> {
  const { email, password, username } = req.body;

  const isUserAlreadyExists = await userModel.findOne({
      $or: [
      { username }, //condition 1
      {email} //condition 2
      ] // Yaani find through either username or email field .
    }
  )

  if (isUserAlreadyExists) {
    res.status(StatusCode.CONFLICT).json({
      message: "User already exists with these credentials"
    });
    return;
  }

  if (password < 6) {
    res.status(StatusCode.BAD_REQUEST).json({
      message: "Password must be of 6 characters"
    });
    return;
  }

  const hashedPassword = await hashPassword(password);

  const user = await userModel.create({
    username,
    email,
    password:hashedPassword
  })

  if (!user) {
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
      message: "User created failed due to some server error"
    });
    return;
  }

  // made the refreshToken and send it in cookies on client side .
  const refreshToken = jwt.sign({ userId: user._id }, config.SECRET_KEY, { expiresIn: "7d" });

  // Hashed the refresh Token , such that if db got compromised and refreshToken is leaked then also no hacker can see any users Refresh Token .
  const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");;

  // Its just a type check such that ip and userAgent can't be undefined .
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  if (!ip || !userAgent) {
    res.status(StatusCode.BAD_REQUEST).json({
      message: "Unable to determine client information"
    });
    return;
  }
  
  // We just created a session with by-default     revoke = false means session is active
  const session = await sessionModel.create({
    user: user._id,
    refreshTokenHash,
    ip,
    userAgent
  })

  //sended the refresh token
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, //Through this , No hacker can access this token from cookie by running javascript in browser console .
    secure: true,
    sameSite: "strict",
    maxAge : 7 * 24 * 60 * 60 * 1000   // 7 days
  });
  

  //made the accessToken , now we will send it to the client in response such that client recieves this accessToken in response by server and then store it in a variable on client side . Like    1. const response = await fetch("/login");     ->     2.const { accessToken } = await response.json();      3.let token = accessToken;     . So, here token is a JavaScript variable, so it’s held in the browser’s JavaScript runtime memory (RAM) while the page/application is running on client side.  
  const accessToken = jwt.sign({ userId: user._id , sessionId:session._id }, config.SECRET_KEY, { expiresIn: "10m" });
  // We have here two functionalities : Either keep the accessToken expiry time very less or add the accessToken blacklist facility . Because let say user logged out then refresh token will be cleared and invalidated , but what if someone have the access token and hacker can use that token even after the user had logged out . So, to make sure that accessToken also become inactive as user log out we do blacklist . But there is a important tradeoff that companies uses that if they add the functionality of    blacklisting then everytime user sends access token for authentcation then they have to make a request in blaclist table to check whether this token is blacklisted or not which increases the response time and also increase request on db just for to protect this small rare possibility of hacking . So, to solve this companies don't use the blacklisting feature , Instead they just reduce the timing of accessToken a little more like only 10min life or 5min life so,that access token will not be active after log out . Here, we didn't added the blacklisting feature , but for more refrence check out Banking-Ledger-Project . There i used .

  
  // sended the accessToken to client in response , So that our client code catch this response and put this token in other variable in Javascript memory on Client side .
  res.status(StatusCode.CREATED).json({
    message: "User created successfully",
    user: user,
    accessToken
  })
  
}









export async function getMeController(req:Request,res:Response):Promise<void> {
  const userData = await userModel.findOne({ _id: req.userId })

  if (!userData) {
    res.status(StatusCode.NOT_FOUND).json({
      message:"User not found"
    });
    return;
  }

  res.status(StatusCode.OK).json({
    userData,
    message:"User fetched successfully"
  })
}










// This function can take the Refresh Token and generate a new accessToken and refreshToken .
export async function refreshTokenController(req:Request,res:Response) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(StatusCode.UNAUTHORIZED).json({
      message: "Invalid Refresh Token"
    });
    return;
  }

  const decoded = jwt.verify(refreshToken, config.SECRET_KEY) as JwtPayload;

  if (typeof decoded.userId !== "string") {
    res.status(StatusCode.UNAUTHORIZED).json({
      message: "Invalid token payload",
    });
    return;
  }
  
  const accessToken = jwt.sign({ userId: decoded.userId }, config.SECRET_KEY , { expiresIn:"15m" });

  // we will generate new Refresh tojen
  const newRefreshToken = jwt.sign({ userId: decoded.userId }, config.SECRET_KEY, { expiresIn: "7days" });

  res.cookie("refreshToken", newRefreshToken, {   // updated the refresh token too .
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  res.status(StatusCode.CREATED).json({
    message: "Access token refreshed successfully",
    accessToken
  })

}








