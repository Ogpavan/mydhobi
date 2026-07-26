import { NextResponse } from "next/server";

import {
  getOperationalReport,
  isOperationalReportKey,
  normalizeOperationalReportRange,
} from "@/lib/operational-reports";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ report: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { report } = await params;
  if (!isOperationalReportKey(report)) {
    return NextResponse.json({ message: "Report not found." }, { status: 404 });
  }

  try {
    const range = normalizeOperationalReportRange(
      new URL(request.url).searchParams.get("range"),
    );
    return NextResponse.json({
      report: await getOperationalReport(report, range),
    });
  } catch (error) {
    console.error(`Load ${report} report failed`, error);
    return NextResponse.json(
      { message: "Unable to load report right now." },
      { status: 500 },
    );
  }
}
