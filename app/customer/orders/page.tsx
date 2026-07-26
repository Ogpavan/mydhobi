import type { Metadata } from "next";

import { MyOrdersView } from "@/components/customer/my-orders-view";
import { listPortalOrders } from "@/lib/customer-portal";
import type { CustomerOrder } from "@/lib/customer-orders";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: { absolute: "My Orders | MyDhobi" } };

export default async function MyOrdersPage() {
  const user = await getCurrentUser();
  const portalOrders = user ? await listPortalOrders(user.id) : [];
  const orders: CustomerOrder[] = portalOrders.map((order) => ({
    id: order.id,
    placedAt: new Date(order.createdAt).toLocaleString("en-IN"),
    shortDate: new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    service: order.service,
    itemCount: order.itemCount,
    amount: order.amount,
    status: order.status === "Delivered" ? "Delivered" : order.status === "Cancelled" ? "Cancelled" : order.status === "Out for Delivery" ? "Out for Delivery" : "In Progress",
    pickup: new Date(order.pickupAt).toLocaleString("en-IN"),
    delivery: order.deliveryAt ? new Date(order.deliveryAt).toLocaleString("en-IN") : "To be updated",
    paid: order.paymentStatus === "Paid",
  }));
  return <MyOrdersView orders={orders} />;
}
