import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import {
  JWT_COOKIE_NAME,
  JWT_MAX_AGE_SECONDS,
  signAuthToken,
} from "@/lib/auth";
import { getUserByEmail } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 },
      );
    }

    const user = await getUserByEmail(email);

    if (!user || user.status !== "active") {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      designation: user.designation,
      role: user.role,
    };
    const token = await signAuthToken(authUser);
    const response = NextResponse.json({ user: authUser });

    response.cookies.set({
      name: JWT_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: JWT_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Login failed", error);

    return NextResponse.json(
      { message: "Unable to sign in right now." },
      { status: 500 },
    );
  }
}
