import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "isg_admin_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

function signSession(createdAt: string) {
  return createHmac("sha256", getAdminPassword()).update(createdAt).digest("hex");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminPassword(password: string) {
  return safeCompare(password, getAdminPassword());
}

export function createAdminSessionCookieValue() {
  const createdAt = String(Date.now());
  return `v1.${createdAt}.${signSession(createdAt)}`;
}

export function isValidAdminSessionValue(value?: string) {
  if (!value) {
    return false;
  }

  const [version, createdAt, signature] = value.split(".");
  if (version !== "v1" || !createdAt || !signature) {
    return false;
  }

  const createdAtMs = Number(createdAt);
  if (!Number.isFinite(createdAtMs) || Date.now() - createdAtMs > SESSION_MAX_AGE_SECONDS * 1000) {
    return false;
  }

  return safeCompare(signature, signSession(createdAt));
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
