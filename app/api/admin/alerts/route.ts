import { NextResponse } from "next/server";

import { listAdminOrders } from "@/lib/admin-orders";
import { listPayments } from "@/lib/payments";
import { listPickupTasks } from "@/lib/pickups";
import { getCurrentUser } from "@/lib/session";
import { listComplaints } from "@/lib/support";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const [orders, pickups, payments, complaints] = await Promise.all([
    listAdminOrders(),
    listPickupTasks(),
    listPayments(),
    listComplaints(),
  ]);
  const alerts = [
    ...orders.filter((item) => item.status === "New").slice(0, 5).map((item) => ({
      id: `order-${item.id}`,
      title: "New order",
      message: `${item.id} from ${item.customerName}`,
      href: `/admin/orders/${item.id}`,
      createdAt: item.createdAt,
    })),
    ...pickups.filter((item) => !item.riderId && !["Completed","Failed"].includes(item.status)).slice(0, 5).map((item) => ({
      id: `pickup-${item.id}`,
      title: "Pickup needs a rider",
      message: `${item.orderId} · ${item.customerName}`,
      href: "/admin/pickups",
      createdAt: item.scheduledAt,
    })),
    ...payments.filter((item) => item.status === "Pending").slice(0, 5).map((item) => ({
      id: `payment-${item.id}`,
      title: "Payment pending",
      message: `${item.reference} · ₹${item.amount}`,
      href: "/admin/payments",
      createdAt: item.createdAt,
    })),
    ...complaints.filter((item) => item.status === "Open").slice(0, 5).map((item) => ({
      id: `complaint-${item.id}`,
      title: "New complaint",
      message: `${item.reference} · ${item.customerName}`,
      href: "/admin/complaints",
      createdAt: item.createdAt,
    })),
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 12);
  return NextResponse.json({ alerts });
}
