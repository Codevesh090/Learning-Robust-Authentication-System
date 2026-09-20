import argon2 from "argon2";
export const hashPassword = async (password) => {
    return await argon2.hash(password);
};
export const verifyPassword = async (password, hashedPassword) => {
    return await argon2.verify(hashedPassword, password);
};
// argon 2 or bcrypt is only used for passwords not for refresh Token hashing . For that we use crypto as crypto generates same result or hash always with the same data . 
//# sourceMappingURL=password.utils.js.map