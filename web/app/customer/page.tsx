import type { Metadata } from "next";
import { CustomerHomeClient } from "@/components/customer/customer-client-pages";

export const metadata: Metadata = {
  title: { absolute: "MyDhobi" },
  description: "Track laundry orders, pickups, deliveries, and payments.",
};

export default function CustomerPage() {
  return <CustomerHomeClient />;
}
