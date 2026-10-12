import { HttpResponse } from "@/server/http-response";

import {
  getReferralProfile,
  recordReferralShare,
  redeemReferralCode,
} from "@/lib/referrals";
import { getCurrentUser } from "@/lib/session";

async function customer() {
  const user = await getCurrentUser();
  return user?.role === "customer" ? user : null;
}

export async function GET() {
  const user = await customer();
  if (!user)
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  return HttpResponse.json({
    profile: await getReferralProfile(user.id, user.name),
  });
}

export async function POST(request: Request) {
  const user = await customer();
  if (!user)
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  if (body.action === "share") {
    await getReferralProfile(user.id, user.name);
    await recordReferralShare(user.id);
    return HttpResponse.json({ success: true });
  }
  if (body.action === "redeem") {
    const code =
      typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!/^[A-Z0-9]{5,20}$/.test(code)) {
      return HttpResponse.json(
        { message: "Enter a valid referral code." },
        { status: 400 },
      );
    }
    const result = await redeemReferralCode(user.id, code);
    const messages = {
      invalid: ["Referral code not found.", 404],
      self: ["You cannot use your own code.", 400],
      already_ordered: ["Referral codes are only for new customers.", 409],
      already_redeemed: ["You already used a referral code.", 409],
    } as const;
    if (result.kind !== "redeemed") {
      const [message, status] = messages[result.kind];
      return HttpResponse.json({ message }, { status });
    }
    return HttpResponse.json({ success: true });
  }
  return HttpResponse.json({ message: "Select an action." }, { status: 400 });
}
