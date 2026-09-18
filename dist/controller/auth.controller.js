import { userModel } from "../models/user.model.js";
import { StatusCode } from "../constants/statusCodes.constant.js";
import jwt from "jsonwebtoken";
import config from "../config/env.config.js";
import { hashPassword } from "../utils/password.utils.js";
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
        password: hashedPassword
    });
    if (!user) {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
            message: "User created failed due to some server error"
        });
        return;
    }
    const token = jwt.sign({ userId: user._id }, config.SECRET_KEY, { expiresIn: "1d" });
    res.cookie("token", token);
    res.status(StatusCode.CREATED).json({
        message: "User created successfully",
        user: user,
        token: token
    });
}
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
    });
}
//# sourceMappingURL=auth.controller.js.map