import type { Metadata } from "next";

import { CustomerAppPreloader } from "@/components/customer/customer-app-preloader";
import { CustomerThemeSync } from "@/components/customer/customer-theme-sync";

export const metadata: Metadata = {
  title: { absolute: "MyDhobi" },
  description: "Track laundry orders, pickups, deliveries, and payments.",
  applicationName: "MyDhobi",
};

export default function CustomerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="customer-app">
      <CustomerThemeSync />
      <CustomerAppPreloader />
      {children}
    </div>
  );
}
