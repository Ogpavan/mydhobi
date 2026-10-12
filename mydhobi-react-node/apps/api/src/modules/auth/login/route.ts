import { HttpResponse } from "@/server/http-response";
import bcrypt from "bcryptjs";

import {
  JWT_COOKIE_NAME,
  JWT_MAX_AGE_SECONDS,
  signAuthToken,
} from "@/lib/auth";
import { getStoreMembershipByUserId } from "@/lib/store-team";
import { getUserByMobile } from "@/lib/users";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mobile?: string;
      password?: string;
    };

    const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!/^\d{10}$/.test(mobile) || !password) {
      return HttpResponse.json(
        { message: "Enter a 10-digit mobile number and password." },
        { status: 400 },
      );
    }

    const user = await getUserByMobile(mobile);

    if (!user || user.status !== "active") {
      return HttpResponse.json(
        { message: "Invalid mobile number or password." },
        { status: 401 },
      );
    }

    const membership =
      user.role === "store_manager"
        ? await getStoreMembershipByUserId(user.id)
        : null;
    if (
      user.role === "store_manager" &&
      (!membership ||
        membership.status !== "active" ||
        membership.role !== "manager")
    ) {
      return HttpResponse.json(
        { message: "This store manager account is not active." },
        { status: 403 },
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return HttpResponse.json(
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
    const response = HttpResponse.json({ user: authUser });

    response.cookies.set({
      name: JWT_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV === "production" &&
        process.env.COOKIE_SECURE !== "false",
      path: "/",
      maxAge: JWT_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Login failed", error);

    return HttpResponse.json(
      { message: "Unable to sign in right now." },
      { status: 500 },
    );
  }
}
