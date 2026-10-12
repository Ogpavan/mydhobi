import { HttpResponse } from "@/server/http-response";

import {
  getOperationalReport,
  isOperationalReportKey,
  normalizeOperationalReportRange,
} from "@/lib/operational-reports";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ report: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { report } = await params;
  if (!isOperationalReportKey(report)) {
    return HttpResponse.json({ message: "Report not found." }, { status: 404 });
  }

  try {
    const range = normalizeOperationalReportRange(
      new URL(request.url).searchParams.get("range"),
    );
    return HttpResponse.json({
      report: await getOperationalReport(
        report,
        range,
        user.role === "store_manager" ? user.storeId : null,
      ),
    });
  } catch (error) {
    console.error(`Load ${report} report failed`, error);
    return HttpResponse.json(
      { message: "Unable to load report right now." },
      { status: 500 },
    );
  }
}
