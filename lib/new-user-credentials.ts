import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "new_user_credentials";
const COOKIE_DURATION_SECONDS = 60 * 5;

export type NewUserCredentials = {
  accountLimit: number;
  agentType: string;
  email: string;
  expiresAt: number;
  id: number;
  name: string;
  password: string;
  role: string;
  status: string;
};

function getEncryptionKey() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }

  return createHash("sha256").update(secret).digest();
}

function encryptCredentials(credentials: NewUserCredentials) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(credentials), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptCredentials(value: string) {
  const [encodedIv, encodedAuthTag, encodedData] = value.split(".");

  if (!encodedIv || !encodedAuthTag || !encodedData) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(encodedIv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(encodedAuthTag, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encodedData, "base64url")),
      decipher.final(),
    ]);
    const credentials = JSON.parse(
      decrypted.toString("utf8"),
    ) as NewUserCredentials;

    if (
      !credentials.id ||
      !credentials.email ||
      !credentials.password ||
      credentials.expiresAt <= Date.now()
    ) {
      return null;
    }

    return credentials;
  } catch {
    return null;
  }
}

export async function setNewUserCredentials(
  credentials: Omit<NewUserCredentials, "expiresAt">,
) {
  const cookieStore = await cookies();
  const value = encryptCredentials({
    ...credentials,
    expiresAt: Date.now() + COOKIE_DURATION_SECONDS * 1000,
  });

  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin/users",
    maxAge: COOKIE_DURATION_SECONDS,
  });
}

export async function getNewUserCredentials() {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;

  return value ? decryptCredentials(value) : null;
}
