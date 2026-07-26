import { NextResponse } from "next/server";

import { getPortalOrder } from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const order = await getPortalOrder(user.id, id);
  if (!order) return NextResponse.json({ message: "Order not found." }, { status: 404 });
  return NextResponse.json({ order });
}
