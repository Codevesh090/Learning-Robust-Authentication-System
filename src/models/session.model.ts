import mongoose , {Model, Types} from "mongoose";

interface Isession {
  user: Types.ObjectId,
  refreshTokenHash: string,
  ip: string,
  userAgent: string,
  revoked: boolean
}

type SessionModel = Model<Isession>

const sessionSchema = new mongoose.Schema<Isession,SessionModel>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: [true, "User is required"]
  },
  refreshTokenHash: {
    type: String,
    required: [true, "refreshHash is required"]
  },
  ip: {
    type: String,
    required: [true, "Ip is required"]
  },
  userAgent: {
    type: String,
    required: [true, "userAgent is required"]
  },
  revoked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});


export const sessionModel = mongoose.model<Isession,SessionModel>("session", sessionSchema);



// In this table , we put each user-session from each device .