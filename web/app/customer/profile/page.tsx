import type { Metadata } from "next";
import { CustomerProfileClient } from "@/components/customer/customer-client-pages";

export const metadata: Metadata = { title: { absolute: "My Profile | MyDhobi" } };

export default function ProfilePage() {
  return <CustomerProfileClient />;
}
