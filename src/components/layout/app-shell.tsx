"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Bell, ShoppingBag } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { IconByName } from "@/components/laundry/icon-map";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Cleanly home">
      <span className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground shadow-card">
        <ShoppingBag className="size-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-base font-extrabold text-foreground">Cleanly</span>
        <span className="block text-xs font-semibold text-muted-foreground">Laundry Service</span>
      </span>
    </Link>
  );
}

export function AppShell({ children, className, showMobileNav = true }: { children: ReactNode; className?: string; showMobileNav?: boolean }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-1 rounded-md border border-border/70 bg-white/75 p-1 shadow-sm md:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-md px-4 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary",
                    active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  <IconByName name={link.icon} className="size-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="relative hidden sm:inline-flex" aria-label="Notifications">
              <Bell className="size-4" />
              <span className="absolute right-1 top-1 size-2 rounded-full bg-accent" />
            </Button>
            <Button asChild variant="accent" className="hidden md:inline-flex">
              <Link href="/book">Book Pickup</Link>
            </Button>
            <Avatar className="size-10 border-2 border-white shadow-sm">
              <AvatarImage src="https://i.pravatar.cc/120?img=47" alt="Priya Sharma" />
              <AvatarFallback>PS</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <main className={cn("mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8", className)}>{children}</main>
      {showMobileNav && <MobileNav />}
    </div>
  );
}
