import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/**
 * A one-time password for an account someone else just created (a Super
 * Admin standing up a School Admin, a School Admin standing up staff in
 * later phases). Returned once in the API response, never logged, never
 * stored — only its bcrypt hash is. Swapped for a real emailed invite
 * link once a mail provider is chosen (blueprint §12).
 */
export function generateTempPassword(length = 14): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TEMP_PASSWORD_ALPHABET[bytes[i]! % TEMP_PASSWORD_ALPHABET.length];
  }
  return out;
}
