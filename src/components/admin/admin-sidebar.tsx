"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag } from "lucide-react";
import { ADMIN_NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { IconByName } from "@/components/laundry/icon-map";

function AdminNavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {ADMIN_NAV_LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary",
              active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
          >
            <IconByName name={link.icon} className="size-5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AdminBrand() {
  return (
    <Link href="/admin" className="mb-8 flex items-center gap-3">
      <span className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground">
        <ShoppingBag className="size-5" />
      </span>
      <span>
        <span className="block text-base font-extrabold">Cleanly Admin</span>
        <span className="block text-xs font-semibold text-muted-foreground">Operations CRM</span>
      </span>
    </Link>
  );
}

export function AdminSidebar() {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border/70 bg-white/70 p-5 backdrop-blur lg:block">
        <AdminBrand />
        <AdminNavLinks />
        <div className="absolute bottom-5 left-5 right-5 rounded-md bg-secondary p-4 text-sm text-muted-foreground">
          <p className="font-bold text-foreground">Today focus</p>
          <p className="mt-1 leading-6">Prioritize pending pickup and ready delivery queues.</p>
        </div>
      </aside>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/90 px-4 py-4 backdrop-blur lg:hidden">
        <AdminBrand />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open admin menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <AdminBrand />
            <AdminNavLinks />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
