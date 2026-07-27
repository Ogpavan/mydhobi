"use client";

import { useEffect } from "react";

import { useCustomerData } from "@/components/customer/customer-client-data";

export function CustomerThemeSync({ darkMode }: { darkMode?: boolean }) {
  const settings = useCustomerData<{
    settings: { darkMode: boolean };
  }>("/api/customer/settings", 60_000);
  const enabled = darkMode ?? settings.data?.settings.darkMode ?? false;

  useEffect(() => {
    document.documentElement.classList.toggle("customer-dark", enabled);
    return () => {
      document.documentElement.classList.remove("customer-dark");
    };
  }, [enabled]);
  return null;
}
