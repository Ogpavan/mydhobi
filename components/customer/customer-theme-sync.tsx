"use client";

import { useEffect } from "react";

export function CustomerThemeSync({ darkMode }: { darkMode: boolean }) {
  useEffect(() => {
    document.documentElement.classList.toggle("customer-dark", darkMode);
    return () => {
      document.documentElement.classList.remove("customer-dark");
    };
  }, [darkMode]);
  return null;
}
