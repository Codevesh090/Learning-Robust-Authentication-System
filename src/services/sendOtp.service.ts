import { otpModel } from "../models/otp.model.js";
import { userModel } from "../models/user.model.js";
import { generateOtp } from "../utils/generateOtp.utils.js";
import { hashingOtp} from "../utils/hashOtp.utils.js";
import { sendEmail } from "./email.service.js";

export async function sendOtp(userId: string) {
  const user = await userModel.findOne({
    _id:userId
  })

  if (!user) {
    throw new Error("User not found");
  }
  
  const otp = await generateOtp();
  const hashOtp = await hashingOtp(otp); // because let say db is leaked or someone got access , then it can steal that otp and verify many accounts .

  await otpModel.deleteMany({  // before creating new otp , delete all old otp . Such that 1 otp at a time per user rahe
    user:userId
  });

  await otpModel.create({
    user: userId,
    otpHash: hashOtp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)  //   means (current time + 5 min) valid only
  })

  await sendEmail(
    user.email,  // to mail
    "Verify your email address",  // subject
    `Your OTP is: ${otp}`,  // text
    `
    <p>Your OTP is:</p>
    <h1><strong>${otp}</strong></h1>
    `  // html
  )
  
}
