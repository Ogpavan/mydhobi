import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CustomerDashboard } from "@/components/customer/customer-dashboard";
import {
  getPortalWallet,
  listPortalAddresses,
  listPortalNotifications,
} from "@/lib/customer-portal";
import { listOffers } from "@/lib/offers";
import { listCatalogServices } from "@/lib/service-catalog";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "MyDhobi" },
  description: "Track laundry orders, pickups, deliveries, and payments.",
};

export default async function CustomerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "customer") redirect("/admin/dashboard");
  const [wallet, services, addresses, notifications, offers] = await Promise.all([
    getPortalWallet(user.id),
    listCatalogServices(false),
    listPortalAddresses(user.id),
    listPortalNotifications(user.id),
    listOffers(true),
  ]);
  const address = addresses.find((item) => item.isDefault) ?? addresses[0];
  return (
    <CustomerDashboard
      user={user}
      walletBalance={wallet.balance}
      services={services}
      location={address ? `${address.city} - ${address.pincode}` : "Add pickup address"}
      unreadNotifications={notifications.filter((item) => !item.is_read).length}
      offer={offers[0] ?? null}
    />
  );
}
