import argon2 from "argon2";

export const hashPassword = async (password: string) => {
  return await argon2.hash(password);
};

export const verifyPassword = async (password: string, hashedPassword: string) => {
   return await argon2.verify(hashedPassword,password);
}

// argon 2 or bcrypt is only used for passwords not for refresh Token hashing . For that we use crypto as crypto generates same result or hash always with the same data . 