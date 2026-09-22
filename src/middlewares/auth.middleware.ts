import type{ Request,Response,NextFunction } from "express";
import { StatusCode } from "../constants/statusCodes.constant.js";
import jwt from "jsonwebtoken";
import config from "../config/env.config.js";

interface JwtPayload {
  userId : string
}


export async function authmiddleware(req:Request, res: Response, next: NextFunction) {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1];   // because client sends access token in headers with the request .  So, token comes out like this         Authorization: Bearer eyJhbGciOiJIUzI1NiIs...     So,we split Bearer and the token eyJhb....  through " " and took the token present at index 1 and put it in the accessToken variable .

    if (!accessToken) {
      res.status(StatusCode.UNAUTHORIZED).json({
        message: "Invalid token"
      });
      return;
    }

    const decoded = jwt.verify(accessToken, config.SECRET_KEY) as JwtPayload; // decoded is of type JwtPayload

    if (typeof decoded.userId !== "string") {
      res.status(StatusCode.UNAUTHORIZED).json({
        message: "Invalid token payload",
      });
      return;
    }

    req.userId = decoded.userId;

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(StatusCode.UNAUTHORIZED).json({
        message: "Access token expired"
    });
    return;
    } // if token expired then give this error .
    
    res.status(StatusCode.UNAUTHORIZED).json({
      message: "Invalid access token"  // else the token is invalid
    });
    return;
  }
}































// About Refresh tokens and Access Token | 
// Let say we generated a jwt token for User A and which expires in 30 days and we saved it in local Storage.
// But here two security problems arise : If let say you downloaded or run some malicious appliation and some hacker runs some javascript script in your broswer console , then it can access your local storage and steal your jwt token and 2nd problem is 30 day is a very large logged-in window , so possiblity of thefting of token increases .
// So, solution came ki hum , token ko http-only secure cookie me rakhte hai token and also expiry time bhi decrease kar dete hai 30days to 1hr . 
// But this again creates two problems : Hackers can't runs a javascript script and access cookie but through some other ways getting access to cookie is possible and 2nd is we decrease our expiry time to 1hr then it ruins the UX or user experience as user have to log in again and again .
// So, At last we reached at a solution : Access token and Refresh Token
// To reduce these faults and security risk what developers thought , We will keep the "Access token in the memory of the program in a variable that will run on Client Side" . This way there is no way to access memory of any variable in a running program through any external methods like running script.Now , it can only be stealed if user's whole device is compromised means stolen or whole device access gone to anyone's device . Like In security, localStorage < Cookies < Memory 
// But it also comes with its own problems , that what if we refresh the page , then toh we will lost the state of a variable , just like in-memory cleans up when server restarts . Simliarly, here same thing will happen that our access token will be cleaned up .
// So,What we do is that now we will generate a Refresh token which has a long live expiry timeline like 30 days and it is used to generate access tokens , means at the moment the access token deletes from the memory ,then a request will go at a specific endpoint with the refresh token that is present in http-only secure cookie and then it will validate the refresh token and will generate a new access token and give back in client side memory. 
// In this , way user don't have to login again and again as Refresh token can automatically get used to generate access tokens and also access token have a short live expiry timeline such that if someone stoles it anyway , the timeline to use it is less means the risk possiblity reduces .
// In total , we have two tokens which reduces the risk of getting hacked : Access token and Refresh token . 
// Access token is stored in program client side memory and have a short life with less expiry time and have the user-data stored , same like the token we use usually  . But Refresh token stores in http-only cookie and they have long-life of expiry and there main work is to generate a new access token as it expires due to either its expiry time or user refreshed the website .
// But it does not mean that Refresh token is safe , If someone stole our refresh token and using that refresh token , generated a access token of our account and used this , then also its very dangerous and risky.That's protecting refresh token is more and very important in this concept . So, its only reduces the chances of failures , not completely removes failure .
// IMPORTANT POINT : JWT is not a token , its just a format of token like Access token and Refresh token both can be a JWT token means of the format of jwt .