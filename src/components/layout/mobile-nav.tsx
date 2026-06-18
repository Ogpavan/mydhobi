"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { IconByName } from "@/components/laundry/icon-map";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-md border border-border/80 bg-white/95 px-3 py-2 shadow-soft backdrop-blur md:hidden">
      <div className="grid grid-cols-4 items-center gap-1">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const isBook = link.href === "/book";

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-bold text-muted-foreground transition-all",
                active && "text-primary",
                isBook && "-mt-8",
              )}
              aria-label={link.label}
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-md transition-all",
                  active && !isBook && "bg-secondary",
                  isBook && "size-14 bg-accent text-accent-foreground shadow-[0_12px_26px_rgb(255_122_0_/_0.28)]",
                )}
              >
                <IconByName name={link.icon} className={cn(isBook ? "size-6" : "size-5")} />
              </span>
              {!isBook && <span>{link.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
