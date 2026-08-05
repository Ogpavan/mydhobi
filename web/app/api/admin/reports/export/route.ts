import { createOrdersCsv, normalizeReportRange } from "@/lib/reports";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  const range = normalizeReportRange(new URL(request.url).searchParams.get("range"));
  const csv = await createOrdersCsv(range, user.role === "store_manager" ? user.storeId : null);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mydhobi-orders-${range}-days.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
