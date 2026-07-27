import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Suspense } from "react";

import { NavigationLoader } from "@/components/navigation-loader";
import { PwaRegister } from "@/components/pwa-register";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MyDhobi Admin",
    template: "%s | MyDhobi Admin",
  },
  description: "Modern laundry and dry-cleaning management dashboard.",
  applicationName: "MyDhobi Admin",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MyDhobi Admin",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#075DFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <Suspense fallback={null}>
          <NavigationLoader />
        </Suspense>
        {children}
        <PwaRegister />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
