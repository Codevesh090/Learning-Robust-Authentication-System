import mongoose,{Types,Model} from "mongoose";

interface Iotp {
  user: Types.ObjectId,
  otpHash: string,
  expiresAt: Date,
  attempts:number
}

type OtpModel = Model<Iotp>

const otpSchema = new mongoose.Schema<Iotp,OtpModel>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"users",
    required: [true, "User is required"],
    unique:true
  },
  otpHash: {
    type: String,
    required:[true,"OTP hash is required"]
  },
  expiresAt: {
    type: Date,
    required:[true,"expiry time is required"]
  },
  attempts: {
    type: Number,
    default:0
  }
}, {
  timestamps:true
})

otpSchema.index(
  { expiresAt: 1 }, // Create an index on the expiresAt field in ascending order.
  { expireAfterSeconds: 0 } // delete the document after 0 sec after expiredAt time . means if expiredAt = 10:45 then it will delete a 10:45 at that exact time .
); // means it a check that when otp gets expired means reached this expiredAt time , we are saying Mongo TTL to delete that doc automatically .


export const otpModel = mongoose.model<Iotp,OtpModel>("otp", otpSchema);