"use client";

import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
