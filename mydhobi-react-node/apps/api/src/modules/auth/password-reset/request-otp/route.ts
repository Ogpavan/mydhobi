import { HttpResponse } from "@/server/http-response";

import { createAuthOtp, invalidateAuthOtp } from "@/lib/auth-otp";
import { getUserByMobile } from "@/lib/users";
import {
  sendOtpSms,
  SmsConfigurationError,
  SmsProviderError,
} from "@/lib/msgclub";

export async function POST(request: Request) {
  const body = (await request.json()) as { mobile?: unknown };
  const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
  const genericMessage =
    "If an active account uses this mobile, we sent a reset code.";

  if (!/^\d{10}$/.test(mobile)) {
    return HttpResponse.json(
      { message: "Enter a 10-digit mobile number." },
      { status: 400 },
    );
  }

  const user = await getUserByMobile(mobile);
  if (!user || user.status !== "active") {
    return HttpResponse.json({ message: genericMessage });
  }

  let challenge: { id: string; code: string } | null = null;
  try {
    challenge = await createAuthOtp(mobile, "password_reset");
    await sendOtpSms(mobile, challenge.code, "password_reset");
  } catch (error) {
    if (challenge) await invalidateAuthOtp(challenge.id);
    if (error instanceof SmsConfigurationError) {
      return HttpResponse.json(
        { message: "SMS service is not configured." },
        { status: 503 },
      );
    }
    if (error instanceof SmsProviderError) {
      return HttpResponse.json(
        { message: "Unable to send the code right now." },
        { status: 502 },
      );
    }
    throw error;
  }

  return HttpResponse.json({ message: genericMessage });
}
