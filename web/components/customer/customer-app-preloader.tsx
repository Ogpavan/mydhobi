"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { preloadCustomerData } from "@/components/customer/customer-client-data";

type CatalogRoutes = {
  services: Array<{ slug: string }>;
};

type OrderRoutes = {
  orders: Array<{ id: string }>;
};

const customerRoutes = [
  "/customer",
  "/customer/about",
  "/customer/addresses",
  "/customer/addresses/new",
  "/customer/cart",
  "/customer/complaints",
  "/customer/help",
  "/customer/notifications",
  "/customer/offers",
  "/customer/orders",
  "/customer/payment",
  "/customer/privacy",
  "/customer/profile",
  "/customer/refer",
  "/customer/schedule",
  "/customer/services",
  "/customer/settings",
  "/customer/terms",
  "/customer/track",
  "/customer/wallet",
  "/customer/wallet/add",
] as const;

export function CustomerAppPreloader() {
  const router = useRouter();

  useEffect(() => {
    for (const route of customerRoutes) router.prefetch(route);

    const catalog = preloadCustomerData<CatalogRoutes>("/api/customer/catalog");
    const orders = preloadCustomerData<OrderRoutes>("/api/customer/orders");

    void Promise.allSettled([
      preloadCustomerData("/api/customer/home"),
      preloadCustomerData("/api/auth/me"),
      preloadCustomerData("/api/customer/addresses"),
      preloadCustomerData("/api/customer/wallet"),
      catalog,
      orders,
    ]);

    void catalog
      .then((data) => {
        for (const service of data.services) {
          router.prefetch(`/customer/services/${service.slug}`);
        }
      })
      .catch(() => undefined);

    void orders
      .then((data) => {
        for (const order of data.orders) {
          router.prefetch(`/customer/orders/${order.id}`);
        }
      })
      .catch(() => undefined);
  }, [router]);

  return null;
}
