import { HttpResponse } from "@/server/http-response";
import bcrypt from "bcryptjs";

import { consumeAuthOtp } from "@/lib/auth-otp";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    mobile?: unknown;
    otp?: unknown;
    password?: unknown;
  };
  const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
  const otp = typeof body.otp === "string" ? body.otp.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!/^\d{10}$/.test(mobile)) {
    return HttpResponse.json(
      { message: "Enter a 10-digit mobile number." },
      { status: 400 },
    );
  }
  if (!/^\d{6}$/.test(otp)) {
    return HttpResponse.json(
      { message: "Enter the 6-digit code." },
      { status: 400 },
    );
  }
  if (password.length < 8 || password.length > 72) {
    return HttpResponse.json(
      { message: "Password must be 8 to 72 characters." },
      { status: 400 },
    );
  }

  const verified = await consumeAuthOtp(mobile, "password_reset", otp);
  if (!verified) {
    return HttpResponse.json(
      { message: "The code is invalid or has expired." },
      { status: 400 },
    );
  }

  const result = await pool.query(
    `UPDATE app_users
     SET password_hash=$2, updated_at=NOW()
     WHERE mobile=$1 AND status='active'`,
    [mobile, await bcrypt.hash(password, 12)],
  );
  if (!result.rowCount) {
    return HttpResponse.json(
      { message: "The code is invalid or has expired." },
      { status: 400 },
    );
  }

  return HttpResponse.json({ message: "Password changed. You can sign in." });
}
