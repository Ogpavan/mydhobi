import type { Metadata } from "next";
import { CustomerOrderDetailsClient } from "@/components/customer/customer-client-pages";

export const metadata: Metadata = { title: { absolute: "Order Details | MyDhobi" } };

export default function OrderDetailsPage() {
  return <CustomerOrderDetailsClient />;
}
