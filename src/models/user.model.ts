import mongoose , {Model} from "mongoose";

interface Iuser {
  username: string,
  email: string,
  password: string,
  verified: boolean
}

type UserModel = Model<Iuser>

const userSchema = new mongoose.Schema<Iuser,UserModel>({
  username: {
    type: String,
    required: [true, "username is required"],
    unique:[true,"username must be unique"]
  },
  email: {
    type: String,
    required: [true, "email is required"],
    unique:[true,"email must be unique"]
  },
  password: {
    type: String,
    required: [true, "password is required"],
    select: false,
  },
  verified: {
    type:Boolean,
    default:false
  }
}, {
  timestamps:true
})


export const userModel = mongoose.model<Iuser,UserModel>("user", userSchema);