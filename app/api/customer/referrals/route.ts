import { NextResponse } from "next/server";

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
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    profile: await getReferralProfile(user.id, user.name),
  });
}

export async function POST(request: Request) {
  const user = await customer();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  if (body.action === "share") {
    await getReferralProfile(user.id, user.name);
    await recordReferralShare(user.id);
    return NextResponse.json({ success: true });
  }
  if (body.action === "redeem") {
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!/^[A-Z0-9]{5,20}$/.test(code)) {
      return NextResponse.json({ message: "Enter a valid referral code." }, { status: 400 });
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
      return NextResponse.json({ message }, { status });
    }
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ message: "Select an action." }, { status: 400 });
}
