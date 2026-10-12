import { HttpResponse } from "@/server/http-response";

import { getReportData, normalizeReportRange } from "@/lib/reports";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const range = normalizeReportRange(
    new URL(request.url).searchParams.get("range"),
  );
  return HttpResponse.json({
    report: await getReportData(
      range,
      user.role === "store_manager" ? user.storeId : null,
    ),
  });
}
