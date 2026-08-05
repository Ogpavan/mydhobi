import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import {
  JWT_COOKIE_NAME,
  JWT_MAX_AGE_SECONDS,
  signAuthToken,
} from "@/lib/auth";
import { getUserByMobile } from "@/lib/users";
import { getStoreMembershipByUserId } from "@/lib/store-team";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mobile?: string;
      password?: string;
    };

    const mobile = body.mobile?.trim() ?? "";
    const password = body.password ?? "";

    if (!/^\d{10}$/.test(mobile) || !password) {
      return NextResponse.json(
        { message: "Enter a 10-digit mobile number and password." },
        { status: 400 },
      );
    }

    const user = await getUserByMobile(mobile);

    if (!user || user.status !== "active") {
      return NextResponse.json(
        { message: "Invalid mobile number or password." },
        { status: 401 },
      );
    }

    const membership = user.role === "store_manager"
      ? await getStoreMembershipByUserId(user.id)
      : null;
    if (user.role === "store_manager" &&
        (!membership || membership.status !== "active" || membership.role !== "manager")) {
      return NextResponse.json(
        { message: "This store manager account is not active." },
        { status: 403 },
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Invalid mobile number or password." },
        { status: 401 },
      );
    }

    const authUser = {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      name: user.name,
      designation: user.designation,
      role: user.role,
      storeId: membership?.storeId ?? null,
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
