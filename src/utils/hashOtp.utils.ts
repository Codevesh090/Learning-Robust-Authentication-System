import crypto from "node:crypto";

export async function hashingOtp(otp:string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}