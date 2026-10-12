import type { AuthUser } from "@mydhobi/domain/auth";
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import type { HttpResponse } from "../platform/http-response";
export type { AuthUser } from "@mydhobi/domain/auth";

export const JWT_COOKIE_NAME = "mydhobi_session";
export const JWT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function setAuthCookie(response: HttpResponse, user: AuthUser) {
  response.cookies.set({
    name: JWT_COOKIE_NAME,
    value: await signAuthToken(user),
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.COOKIE_SECURE !== "false",
    path: "/",
    maxAge: JWT_MAX_AGE_SECONDS,
  });
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

export async function signAuthToken(user: AuthUser) {
  return new SignJWT({
    email: user.email,
    mobile: user.mobile,
    name: user.name,
    designation: user.designation,
    role: user.role,
    ...(user.storeId ? { storeId: user.storeId } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? "7d")
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    if (
      !payload.sub ||
      typeof payload.email !== "string" ||
      typeof payload.mobile !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.designation !== "string" ||
      (payload.role !== "admin" &&
        payload.role !== "staff" &&
        payload.role !== "store_manager" &&
        payload.role !== "customer")
    ) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      mobile: payload.mobile,
      name: payload.name,
      designation: payload.designation,
      role: payload.role,
      storeId: typeof payload.storeId === "string" ? payload.storeId : null,
    };
  } catch {
    return null;
  }
}
