import crypto from "node:crypto";
export const refreshTokenHashing = (refreshToken) => {
    return crypto.createHash("sha256").update(refreshToken).digest("hex");
};
//# sourceMappingURL=refreshTokenHash.utils.js.map