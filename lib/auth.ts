import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

const COOKIE_NAME = "license_admin_session";
const DEFAULT_SESSION_DURATION_SECONDS = 60 * 60 * 8;
const REMEMBERED_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = {
  userId: number;
  email: string;
  name: string;
  role: string;
  expiresAt: number;
};

type DatabaseUser = {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  role: string;
  status: string;
};

function getRequiredEnv(name: "SESSION_SECRET") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function sign(value: string) {
  return createHmac("sha256", getRequiredEnv("SESSION_SECRET"))
    .update(value)
    .digest("base64url");
}

export async function validateCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return null;
  }

  const sql = getDb();
  const rows = (await sql`
    SELECT id, email, name, password_hash, role, status
    FROM users
    WHERE LOWER(email) = ${normalizedEmail}
    LIMIT 1
  `) as Record<string, unknown>[];
  const user = rows[0] as DatabaseUser | undefined;

  if (
    !user ||
    user.status !== "active" ||
    !(await verifyPassword(password, user.password_hash))
  ) {
    return null;
  }

  await sql`
    UPDATE users
    SET last_login_at = NOW(), updated_at = NOW()
    WHERE id = ${user.id}
  `;

  return {
    id: Number(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export function createSessionToken(user: {
  id: number;
  email: string;
  name: string;
  role: string;
}, durationSeconds = DEFAULT_SESSION_DURATION_SECONDS) {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    expiresAt: Date.now() + durationSeconds * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export async function setSession(user: {
  id: number;
  email: string;
  name: string;
  role: string;
}, rememberMe = false) {
  const cookieStore = await cookies();
  const durationSeconds = rememberMe
    ? REMEMBERED_SESSION_DURATION_SECONDS
    : DEFAULT_SESSION_DURATION_SECONDS;

  cookieStore.set(COOKIE_NAME, createSessionToken(user, durationSeconds), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(rememberMe ? { maxAge: durationSeconds } : {}),
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature || !safeEqual(signature, sign(encodedPayload))) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (
      !payload.userId ||
      !payload.email ||
      !payload.name ||
      !payload.role ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }

    const sql = getDb();
    const rows = (await sql`
      SELECT id, email, name, role, status
      FROM users
      WHERE id = ${payload.userId}
      LIMIT 1
    `) as Record<string, unknown>[];
    const user = rows[0] as DatabaseUser | undefined;

    if (!user || user.status !== "active") {
      return null;
    }

    return {
      email: user.email,
      expiresAt: payload.expiresAt,
      name: user.name,
      role: user.role,
      userId: Number(user.id),
    };
  } catch {
    return null;
  }
}
