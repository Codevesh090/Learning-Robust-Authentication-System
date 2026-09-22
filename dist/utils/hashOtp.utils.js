import crypto from "node:crypto";
export async function hashingOtp(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
}
//# sourceMappingURL=hashOtp.utils.js.map