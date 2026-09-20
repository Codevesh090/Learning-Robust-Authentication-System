import crypto from "node:crypto";

export const refreshTokenHashing = (refreshToken: string): string => {
  return crypto.createHash("sha256").update(refreshToken).digest("hex")
}