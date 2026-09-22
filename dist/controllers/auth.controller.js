import { userModel } from "../models/user.model.js";
import { StatusCode } from "../constants/statusCodes.constant.js";
import jwt from "jsonwebtoken";
import config from "../config/env.config.js";
import { hashPassword, verifyPassword } from "../utils/password.utils.js";
import { sessionModel } from "../models/session.model.js";
import { refreshTokenHashing } from "../utils/refreshTokenHash.utils.js";
import { sendOtp } from "../services/sendOtp.service.js";
import { otpModel } from "../models/otp.model.js";
import { hashingOtp } from "../utils/hashOtp.utils.js";
// register handler
export async function userRegisterController(req, res) {
    const { email, password, username } = req.body;
    const isUserAlreadyExists = await userModel.findOne({
        $or: [
            { username }, //condition 1
            { email } //condition 2
        ] // Yaani find through either username or email field .
    });
    if (isUserAlreadyExists) {
        res.status(StatusCode.CONFLICT).json({
            message: "User already exists with these credentials"
        });
        return;
    }
    if (password.length < 6) {
        res.status(StatusCode.BAD_REQUEST).json({
            message: "Password must be of 6 characters"
        });
        return;
    }
    const hashedPassword = await hashPassword(password);
    const user = await userModel.create({
        username,
        email,
        password: hashedPassword
    });
    if (!user) {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
            message: "User created failed due to some server error"
        });
        return;
    }
    await sendOtp(user._id.toString()); // sent otp
    res.status(StatusCode.CREATED).json({
        message: "Account created successfully. OTP sent to your email.Please verify",
        user: {
            userId: user._id,
            email
        }, // we will send email and userId to the client when user signUp
    });
}
// The flow will be :     User signUp    ->   Click on verify account and then using otp its verifies     ->    Then login again    ->   Now,access Token and Refresh Token will get generated   -> Now, using that access token User can access any page .   If Access Token expire then one automatic call goes from client side to server side to generate new Refresh Token and Access Token . 
// login handler
export async function userLoginController(req, res) {
    const { email, password } = req.body;
    const user = await userModel.findOne({
        email
    });
    if (!user) {
        res.status(StatusCode.UNAUTHORIZED).json({
            message: "User not found , please sign up to continue"
        });
        return;
    }
    if (!user.verified) {
        res.status(StatusCode.FORBIDDEN).json({
            message: "User is not verified yet , Please verify your email to log in "
        });
        return;
    }
    if (!verifyPassword(password, user?.password)) {
        res.status(StatusCode.UNAUTHORIZED).json({
            message: "Password is incorrect, Pleae try again"
        });
        return;
    }
    // made the refreshToken and send it in cookies on client side .
    const refreshToken = jwt.sign({ userId: user._id }, config.SECRET_KEY, { expiresIn: "7d" });
    // Hashed the refresh Token , such that if db got compromised and refreshToken is leaked then also no hacker can see any users Refresh Token .
    const refreshTokenHash = refreshTokenHashing(refreshToken);
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
    });
    //sended the refresh token
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    //made the accessToken , now we will send it to the client in response such that client recieves this accessToken in response by server and then store it in a variable on client side . Like    1. const response = await fetch("/login");     ->     2.const { accessToken } = await response.json();      3.let token = accessToken;     . So, here token is a JavaScript variable, so it’s held in the browser’s JavaScript runtime memory (RAM) while the page/application is running on client side.  
    const accessToken = jwt.sign({ userId: user._id, sessionId: session._id }, config.SECRET_KEY, { expiresIn: "10m" });
    // We have here two functionalities : Either keep the accessToken expiry time very less or add the accessToken blacklist facility . Because let say user logged out then refresh token will be cleared and invalidated , but what if someone have the access token and hacker can use that token even after the user had logged out . So, to make sure that accessToken also become inactive as user log out we do blacklist . But there is a important tradeoff that companies uses that if they add the functionality of    blacklisting then everytime user sends access token for authentcation then they have to make a request in blaclist table to check whether this token is blacklisted or not which increases the response time and also increase request on db just for to protect this small rare possibility of hacking . So, to solve this companies don't use the blacklisting feature , Instead they just reduce the timing of accessToken a little more like only 10min life or 5min life so,that access token will not be active after log out . Here, we didn't added the blacklisting feature , but for more refrence check out Banking-Ledger-Project . There i used .
    // sended the accessToken to client in response , So that our client code catch this response and put this token in other variable in Javascript memory on Client side .
    res.status(StatusCode.CREATED).json({
        message: "User Logged In successfully",
        user,
        accessToken,
    });
}
// getMe handler
export async function getMeController(req, res) {
    const userData = await userModel.findOne({ _id: req.userId });
    if (!userData) {
        res.status(StatusCode.NOT_FOUND).json({
            message: "User not found"
        });
        return;
    }
    res.status(StatusCode.OK).json({
        userData,
        message: "User fetched successfully"
    });
}
// This function can take the Refresh Token and generate a new accessToken and refreshToken .
export async function refreshTokenController(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        res.status(StatusCode.UNAUTHORIZED).json({
            message: "Invalid Refresh Token"
        });
        return;
    }
    // decoded it | We kept this decoding before hashing , kyuki agar server verify hi nahi kar paaya , ki usne yeh token nahi banaya tha . Toh hume db par request karne ki koi need nahi hai , we saved one db request/operation .
    const decoded = jwt.verify(refreshToken, config.SECRET_KEY);
    if (typeof decoded.userId !== "string") {
        res.status(StatusCode.UNAUTHORIZED).json({
            message: "Invalid token payload",
        });
        return;
    }
    // created the hash
    const refreshTokenHash = refreshTokenHashing(refreshToken);
    // found the session document in db which has this hash
    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false //means abhi bhi session active hai .
    });
    // if not found means session is either invalidated means user logged out with this refresh token .
    if (!session) {
        res.status(StatusCode.UNAUTHORIZED).json({
            message: "Invalid refresh Token"
        });
        return;
    }
    // we will generate new Refresh token
    const newRefreshToken = jwt.sign({ userId: decoded.userId }, config.SECRET_KEY, { expiresIn: "7d" });
    // we will hash the new generated token
    const newRefreshTokenHash = refreshTokenHashing(newRefreshToken);
    // update the refresh token in the database 
    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();
    // set the newRefreshToken in the cookie
    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    // generate a new access token
    const accessToken = jwt.sign({ userId: decoded.userId }, config.SECRET_KEY, { expiresIn: "10m" });
    // send back to client
    res.status(StatusCode.CREATED).json({
        message: "Access token refreshed successfully",
        accessToken
    });
    // Here , we    |  Took the refresh token and checked it is valid or not  ->  decoded it means server checked ki usne kabhi yeh token pehle banaya tha kya . If no then wahi ruk jaayega and if yes then next    ->   We hashed the refresh token and tried to find the doc in session table   ->  And if it does not found , it means that session does not exist anymore , so it will stop there  ->  But if session exist then generate the new refresh token , update the db and then only generate the new access token.
    // Generation of new Refresh Token and inavlidation the old refresh token in db with the new access token called as token rotation . Yaani refresh token ko update karte rehna with new access token called as token rotation .
}
// logout handler
export async function logoutController(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        res.status(StatusCode.UNAUTHORIZED).json({
            message: "Refresh Token not found"
        });
        return;
    }
    ;
    const refreshTokenHash = refreshTokenHashing(refreshToken); // same data gives same hash when we use "crypto" which is node built-in hashing package .
    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false
    });
    if (!session) {
        res.status(StatusCode.NOT_FOUND).json({
            message: "Session not found"
        });
        return;
    }
    session.revoked = true;
    await session.save();
    res.clearCookie("refreshToken");
    res.status(StatusCode.CREATED).json({
        message: "Logged out successfully"
    });
    // Yaha humne    |    Took the refreshToken from cookies   ->  Created its hash through crypto  ->  Found that document that contain this refreshTokenHash  ->   Invalidated the Refresh Token in session means closed/revoked the session    ->   Removed the refreshToken from the cookies    ->    And logged out successfully
}
// logout-all handler
export async function logoutAllController(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        res.status(StatusCode.UNAUTHORIZED).json({
            message: "Invalid Refresh Token"
        });
        return;
    }
    const decoded = jwt.verify(refreshToken, config.SECRET_KEY);
    if (typeof decoded.userId !== "string") {
        res.status(StatusCode.UNAUTHORIZED).json({
            message: "Invalid token payload"
        });
        return;
    }
    await sessionModel.updateMany({
        user: decoded.userId,
        revoked: false
    }, {
        $set: { revoked: true }
    });
    res.clearCookie("refreshToken");
    res.status(StatusCode.CREATED).json({
        message: "Log out of all devices successfully"
    });
}
;
// send-Verification-Otp handler
export async function sendVerificationOtpController(req, res) {
    const { userId } = req.body;
    await sendOtp(userId); // Never blindly trust data received from the client. Always validate it and, when possible, derive sensitive information from trusted server-side data only . Client userId ke saath email bhi bhej sakta hai, but hum client ke diye hue email ko blindly trust nahi karenge.
    // Hum server-validated userId se DB mein user find karke database mein stored email use karenge, kyunki wahi authoritative data hai.
    res.status(200).json({
        message: "OTP sent successfully",
    });
}
// when we click "Resend OTP" then also this same function or route gets the hit /api/auth/sendVerificatioOtp
// verify-Otp handler
export async function verifyOtpController(req, res) {
    const { userId, otp } = req.body;
    const verification = await otpModel.findOne({
        userId
    });
    if (!verification) {
        res.status(StatusCode.BAD_REQUEST).json({
            message: "message not found"
        });
        return;
    }
    if (verification.attempts >= 5) {
        await otpModel.findOneAndDelete({
            _id: verification._id,
        });
        res.status(StatusCode.TOO_MANY_REQUESTS).json({
            message: "Maximum OTP verification attempts reached. Please request a new OTP."
        });
        return;
    }
    if (verification.expiresAt < new Date()) { // if otp is expired then it will delete that otp record from the db and say otp expired .
        await otpModel.findOneAndDelete({
            _id: verification._id
        });
        res.status(400).json({
            message: "OTP expired",
        });
        return;
    }
    const hashOtp = await hashingOtp(otp);
    if (hashOtp !== verification.otpHash) {
        verification.attempts += 1; // every failed otp or wrong otp can increase the attempts by +1 .
        await verification.save();
        res.status(StatusCode.BAD_REQUEST).json({
            message: "Invalid OTP"
        });
        return;
    }
    await userModel.findOneAndUpdate({ _id: userId }, // find one 
    { verified: true } // update
    ); // set the verifies status = true
    await otpModel.findOneAndDelete({
        _id: verification._id
    }); // delete the otp record of that user from the db as user is verified .
    res.status(StatusCode.OK).json({
        message: "Email verified successfully"
    });
}
//# sourceMappingURL=auth.controller.js.map