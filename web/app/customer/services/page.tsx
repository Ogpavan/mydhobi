import type { Metadata } from "next";

import { CustomerServicesClient } from "@/components/customer/customer-client-pages";

export const metadata: Metadata = { title: { absolute: "Our Services | MyDhobi" } };
export default function ServicesPage() {
  return <CustomerServicesClient />;
}
