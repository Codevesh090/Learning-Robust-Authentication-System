import { Model } from "mongoose";
interface Iuser {
    username: string;
    email: string;
    password: string;
}
type UserModel = Model<Iuser>;
export declare const userModel: UserModel;
export {};
//# sourceMappingURL=user.model.d.ts.map