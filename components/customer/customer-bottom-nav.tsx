import {
  ClipboardList,
  Home,
  Sparkles,
  UserRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type CustomerNavItem = "home" | "orders" | "services" | "wallet" | "profile";

const items = [
  { id: "home", label: "Home", icon: Home, href: "/customer" },
  { id: "orders", label: "Orders", icon: ClipboardList, href: "/customer/orders" },
  { id: "services", label: "Services", icon: Sparkles, href: "/customer/services" },
  { id: "wallet", label: "Wallet", icon: WalletCards, href: "/customer/wallet" },
  { id: "profile", label: "Profile", icon: UserRound, href: "/customer/profile" },
] satisfies Array<{
  id: CustomerNavItem;
  label: string;
  icon: LucideIcon;
  href: string;
}>;

export function CustomerBottomNav({ active }: { active: CustomerNavItem }) {
  return (
    <nav
      aria-label="Customer navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#eceaf2] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_26px_rgba(40,33,72,0.08)] backdrop-blur-xl"
    >
      <div className="mx-auto grid h-[70px] w-full max-w-[720px] grid-cols-5 px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = item.id === active;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition hover:bg-[#faf8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c4fe5]",
                selected ? "text-[#7546dd]" : "text-[#77798a]",
              )}
            >
              <Icon className="h-[21px] w-[21px]" strokeWidth={selected ? 2.5 : 1.9} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
