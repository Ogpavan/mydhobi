import { HttpResponse } from "@/server/http-response";

import { consumeAuthOtp } from "@/lib/auth-otp";
import { setAuthCookie } from "@/lib/auth";
import { getStoreMembershipByUserId } from "@/lib/store-team";
import { getUserByMobile } from "@/lib/users";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    mobile?: unknown;
    otp?: unknown;
  };
  const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
  const otp = typeof body.otp === "string" ? body.otp.trim() : "";

  if (!/^\d{10}$/.test(mobile) || !/^\d{6}$/.test(otp)) {
    return HttpResponse.json(
      { message: "Enter a 10-digit mobile number and 6-digit code." },
      { status: 400 },
    );
  }

  const user = await getUserByMobile(mobile);
  if (
    !user ||
    user.status !== "active" ||
    !(await consumeAuthOtp(mobile, "login", otp))
  ) {
    return HttpResponse.json(
      { message: "The code is invalid or has expired." },
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

  const authUser = {
    id: user.id,
    email: user.email,
    mobile: user.mobile,
    name: user.name,
    designation: user.designation,
    role: user.role,
    storeId: membership?.storeId ?? null,
  };
  const response = HttpResponse.json({ user: authUser });
  await setAuthCookie(response, authUser);
  return response;
}
