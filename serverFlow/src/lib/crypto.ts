import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;

  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY is not set");
  }

  const keyBuffer = Buffer.from(key, "base64");

  if (keyBuffer.length !== 32) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must decode to 32 bytes (base64-encoded AES-256 key)"
    );
  }

  return keyBuffer;
}

export function decryptToken(ciphertext: string): string {
  if (!ciphertext) return "";

  const raw = Buffer.from(ciphertext, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
