import { Types, Model } from "mongoose";
interface Iotp {
    user: Types.ObjectId;
    otpHash: string;
    expiresAt: Date;
    attempts: number;
}
type OtpModel = Model<Iotp>;
export declare const otpModel: OtpModel;
export {};
//# sourceMappingURL=otp.model.d.ts.map