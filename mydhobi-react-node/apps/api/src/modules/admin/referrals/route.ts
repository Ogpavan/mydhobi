import { HttpResponse } from "@/server/http-response";

import { listReferrals } from "@/lib/referrals";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return HttpResponse.json({ referrals: await listReferrals() });
}
