import type { Metadata } from "next";

import { CustomerOrdersClient } from "@/components/customer/customer-client-pages";

export const metadata: Metadata = { title: { absolute: "My Orders | MyDhobi" } };

export default function MyOrdersPage() {
  return <CustomerOrdersClient />;
}
