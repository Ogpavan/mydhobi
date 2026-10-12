import { HttpResponse } from "@/server/http-response";

import { getPaymentStats, listPayments } from "@/lib/payments";
import { canAccessAdminPage } from "@/lib/role-permissions";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "payments"))) {
    return HttpResponse.json(
      { message: "You do not have access to payments." },
      { status: 403 },
    );
  }
  const [payments, stats] = await Promise.all([
    listPayments(user.role === "store_manager" ? user.storeId : null),
    getPaymentStats(user.role === "store_manager" ? user.storeId : null),
  ]);
  return HttpResponse.json({ payments, stats });
}
