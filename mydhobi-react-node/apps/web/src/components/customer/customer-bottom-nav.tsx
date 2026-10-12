import Link from "@/platform/navigation";
import { ClipboardList, Home, Package, UserRound } from "lucide-react";

export type CustomerNavItem =
  | "home"
  | "orders"
  | "schedule"
  | "offers"
  | "packages"
  | "profile"
  // Older screens still pass these values. They deliberately fall back to no
  // highlighted item instead of breaking their navigation.
  | "services"
  | "wallet";

const navItems = [
  { id: "home", label: "Home", href: "/customer", Icon: Home },
  {
    id: "orders",
    label: "Orders",
    href: "/customer/orders",
    Icon: ClipboardList,
  },
  {
    id: "packages",
    label: "Packages",
    href: "/customer/packages",
    Icon: Package,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/customer/profile",
    Icon: UserRound,
  },
] as const;

/** The primary mobile navigation used throughout the customer experience. */
export function CustomerBottomNav({ active }: { active: CustomerNavItem }) {
  return (
    <nav
      aria-label="Customer navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e9e3f2] bg-white/95 shadow-[0_-5px_18px_rgba(68,43,110,0.08)] backdrop-blur"
    >
      <div className="mx-auto grid h-[70px] w-full max-w-[520px] grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ id, label, href, Icon }) => {
          const selected = active === id;

          return (
            <Link
              key={id}
              href={href}
              aria-current={selected ? "page" : undefined}
              className={`relative flex min-w-0 flex-col items-center justify-center gap-1 text-[9px] font-semibold transition ${
                selected ? "text-[#7040dc]" : "text-[#827b91]"
              }`}
            >
              <Icon
                className="h-[21px] w-[21px]"
                strokeWidth={selected ? 2.5 : 2}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
