import { HttpResponse } from "@/server/http-response";

import { getCurrentUser } from "@/lib/session";
import { getComplaintStats, listComplaints } from "@/lib/support";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const [complaints, stats] = await Promise.all([
    listComplaints(user.role === "store_manager" ? user.storeId : null),
    getComplaintStats(user.role === "store_manager" ? user.storeId : null),
  ]);
  return HttpResponse.json({ complaints, stats });
}
