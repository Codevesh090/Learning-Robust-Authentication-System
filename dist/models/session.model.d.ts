import { Model, Types } from "mongoose";
interface Isession {
    user: Types.ObjectId;
    refreshTokenHash: string;
    ip: string;
    userAgent: string;
    revoked: boolean;
}
type SessionModel = Model<Isession>;
export declare const sessionModel: SessionModel;
export {};
//# sourceMappingURL=session.model.d.ts.map