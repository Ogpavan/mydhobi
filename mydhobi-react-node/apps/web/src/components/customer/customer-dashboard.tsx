import Link, { useRouter } from "@/platform/navigation";
import Image from "@/platform/image";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  MapPin,
  Phone,
  Search,
} from "lucide-react";
import { useState } from "react";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { CustomerSidebar } from "@/components/customer/customer-sidebar";
import { startNavigationProgress } from "@/components/navigation-loader";
import type { AuthUser } from "@/lib/auth";
import type { PortalOrder } from "@/lib/customer-portal";
import type { Offer } from "@/lib/offers";
import { readDraft, saveDraft } from "./ordering-state";

function pickupLabel(order: PortalOrder) {
  const date = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(order.pickupAt));
  return order.pickupSlot ? `${date} · ${order.pickupSlot}` : date;
}

const primaryFallbackImages = [
  "/dryclean.png",
  "/ironwashing.png",
  "/wash_fold.png",
];
const secondaryFallback = ["👟", "👜", "🪟", "🛋️"];

export function CustomerDashboard({
  user,
  location,
  unreadNotifications,
  offer,
  upcomingOrder,
  recentOrders,
  pickupAddressId,
  storeId,
  services,
}: {
  user: AuthUser;
  location: string;
  unreadNotifications: number;
  offer: Offer | null;
  upcomingOrder: PortalOrder | null;
  recentOrders: PortalOrder[];
  pickupAddressId: string;
  storeId: string;
  services: Array<{ id: string; name: string; imagePath?: string | null }>;
}) {
  const offerTitle = offer?.title || "Get 20% off on your first order";
  const router = useRouter();
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const primaryServices = services.slice(0, 3);
  const extraServices = services.slice(3, 7);

  function toggleService(id: string) {
    setSelectedServiceIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  function scheduleSelectedServices() {
    if (!storeId || selectedServiceIds.length === 0) return;
    const current = readDraft();
    saveDraft({
      ...current,
      kind: "quick",
      storeId,
      items: [],
      serviceIds: selectedServiceIds,
      addressId: current.addressId || pickupAddressId,
      date: "",
      slot: "",
      instructions: "",
      coupon: "",
      requestKey: "",
      quickItemCount: 0,
      method: "cash",
      delivery: "standard",
    });
    startNavigationProgress();
    router.push("/customer/schedule");
  }

  return (
    <div className="customer-home min-h-screen overflow-x-hidden bg-[#faf8ff] pb-[88px] text-[#211a35]">
      <header className="mx-auto w-full max-w-[520px] bg-white px-4 pb-2 pt-[max(10px,env(safe-area-inset-top))]">
        <div className="relative flex h-12 items-center justify-between">
          <CustomerSidebar />
          <div
            className="absolute left-1/2 -translate-x-1/2 text-center"
            aria-label="MyDhobi"
          >
            <span className="text-[25px] font-black tracking-[-0.07em] text-[#7040dc]">
              my
            </span>
            <span className="text-[25px] font-black tracking-[-0.07em] text-[#a174f2]">
              dhobi
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <a
              href="tel:"
              aria-label="Call MyDhobi"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#7040dc]"
            >
              <Phone className="h-[19px] w-[19px]" fill="currentColor" />
            </a>
            <Link
              href="/customer/notifications"
              aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ""}`}
              className="relative mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ece9f4] bg-white text-[#32294a] shadow-[0_2px_8px_rgba(45,29,78,0.05)]"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadNotifications > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ed3e58]" />
              )}
            </Link>
          </div>
        </div>
        <Link
          href="/customer/addresses"
          className="flex items-center justify-center gap-1 text-[9px] font-medium text-[#6e667b]"
        >
          <MapPin className="h-3 w-3 text-[#7040dc]" />
          <span className="max-w-[290px] truncate">{location}</span>
          <ChevronDown className="h-3 w-3" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[520px] space-y-0 px-0 pt-0">
        <section className="relative min-h-[338px] overflow-hidden border-y border-[#eee9f6] bg-[#f8f6fc] px-4 pt-5 text-white">
          <div className="relative z-10 text-center">
            <p className="text-[19px] font-light uppercase tracking-[-0.04em] text-[#4b4b4b]">
              India&apos;s most trusted
            </p>
            <p className="mt-1 text-[21px] font-medium uppercase tracking-[-0.03em] text-[#3e4551]">
              Dry Clean &amp; Laundry Chain
            </p>
          </div>
          <Image
            src="/mydhobi-lime-hero-v1.png"
            alt=""
            aria-hidden="true"
            fill
            className="pointer-events-none absolute inset-x-0 top-12 z-0 mx-auto h-[238px] w-[90%] object-contain object-center"
          />
          <div className="absolute inset-x-0 bottom-0 flex h-10 items-center justify-center gap-3 border-t border-[#eee9f6] bg-white/80 text-[8px] font-semibold text-[#6e667b]">
            <span>1400+ Stores</span>
            <i className="h-3 border-l border-[#aab1a1]" />
            <span>600+ Cities</span>
            <i className="h-3 border-l border-[#aab1a1]" />
            <span>30+ Lakhs Happy Customers</span>
          </div>
        </section>

        <section className="px-4 pt-8">
          <div className="mb-6 text-center">
            <h2 className="text-[20px] font-medium tracking-[-0.03em] text-[#202020]">
              Select Service
            </h2>
            <p className="mt-1 text-[9px] font-medium text-[#878787]">
              Choose one or more services
            </p>
          </div>
          {primaryServices.length ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {primaryServices.map((service, index) => {
                  const selected = selectedServiceIds.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleService(service.id)}
                      className={`min-h-[154px] rounded-[18px] border px-2 py-5 text-center transition ${selected ? "border-2 border-[#7440dc] bg-[#f4efff]" : "border-[#e5def2] bg-white"}`}
                    >
                      <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f9fbf3]">
                        {service.imagePath ? (
                          <Image
                            src={service.imagePath}
                            alt=""
                            width={58}
                            height={58}
                            className="h-[58px] w-[58px] object-contain"
                          />
                        ) : (
                          <Image
                            src={primaryFallbackImages[index]}
                            alt=""
                            width={58}
                            height={58}
                            className="h-[58px] w-[58px] object-contain"
                          />
                        )}
                        {selected && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#7440dc] text-[9px] font-bold text-white">
                            ✓
                          </span>
                        )}
                      </span>
                      <span className="mt-3 block line-clamp-2 text-[14px] font-medium leading-[1.1] text-[#202020]">
                        {service.name.replace("&", "And")}
                      </span>
                    </button>
                  );
                })}
              </div>
              {extraServices.length > 0 && (
                <div className="mt-3 hidden grid-cols-4 gap-2">
                  {extraServices.map((service, index) => {
                    const selected = selectedServiceIds.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleService(service.id)}
                        className={`relative min-h-[75px] rounded-xl border px-1 py-2 text-center shadow-[0_2px_8px_rgba(45,29,78,0.025)] ${selected ? "border-[#7440dc] bg-[#f4efff]" : "border-[#e5def2] bg-white"}`}
                      >
                        <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f8df] text-[17px]">
                          {service.imagePath ? (
                            <Image
                              src={service.imagePath}
                              alt=""
                              width={30}
                              height={30}
                              className="h-[30px] w-[30px] object-contain"
                            />
                          ) : (
                            secondaryFallback[index]
                          )}
                        </span>
                        <span className="mt-1.5 block line-clamp-2 text-[8px] font-semibold leading-tight text-[#514962]">
                          {service.name}
                        </span>
                        {selected && (
                          <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#7440dc] text-[8px] text-white">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <Link
              href="/customer/quick-pickup"
              className="flex h-20 items-center justify-center rounded-xl border border-dashed border-[#d9d2e7] bg-white text-[10px] font-bold text-[#7040dc]"
            >
              Choose services
            </Link>
          )}
          <button
            type="button"
            disabled={!storeId || selectedServiceIds.length === 0}
            onClick={scheduleSelectedServices}
            className="mt-10 flex h-[56px] w-full items-center justify-center rounded-[14px] bg-[linear-gradient(100deg,#7040dc,#8b4def)] text-[15px] font-semibold text-white shadow-[0_5px_14px_rgba(112,64,220,0.22)] disabled:bg-[#c9b7ec]"
          >
            {selectedServiceIds.length
              ? `Schedule ${selectedServiceIds.length} service${selectedServiceIds.length > 1 ? "s" : ""}`
              : "Schedule Pickup"}
          </button>
        </section>

        <Link
          href="/customer/offers"
          className="relative hidden min-h-[82px] overflow-hidden rounded-2xl px-4 py-3 text-[#28320d] shadow-[0_7px_18px_rgba(133,177,16,0.16)]"
          style={{
            backgroundImage: "linear-gradient(105deg, #7040dc, #a174f2)",
          }}
        >
          <span className="relative z-10 min-w-0">
            <span className="block text-[9px] font-semibold text-[#506319]">
              SPECIAL OFFER
            </span>
            <span className="mt-1 block max-w-[205px] text-[14px] font-extrabold leading-tight">
              {offerTitle}
            </span>
            <span className="mt-1.5 inline-flex rounded bg-[#7040dc] px-2 py-0.5 text-[8px] font-bold text-white">
              {offer?.code || "USE CODE: MYDHOBI20"}
            </span>
          </span>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[44px]">
            ✨
          </span>
        </Link>

        {upcomingOrder && (
          <section className="hidden rounded-2xl border border-[#e8e5ef] bg-white p-3 shadow-[0_3px_10px_rgba(45,29,78,0.035)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-extrabold text-[#302847]">
                  Your next pickup
                </p>
                <p className="mt-0.5 text-[9px] text-[#827a91]">
                  #{upcomingOrder.id} · {upcomingOrder.service}
                </p>
              </div>
              <span className="rounded-full bg-[#eaf8ef] px-2 py-1 text-[8px] font-bold text-[#25834c]">
                {upcomingOrder.status === "New"
                  ? "Scheduled"
                  : upcomingOrder.status}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#f5f2fc] px-2.5 py-2">
              <span className="flex min-w-0 items-center gap-1.5 text-[9px] font-medium text-[#625a70]">
                <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[#6b2be2]" />{" "}
                <span className="truncate">{pickupLabel(upcomingOrder)}</span>
              </span>
              <Link
                href={`/customer/orders/${encodeURIComponent(upcomingOrder.id)}`}
                className="shrink-0 text-[9px] font-bold text-[#6b2be2]"
              >
                Track
              </Link>
            </div>
          </section>
        )}

        {recentOrders.length > 0 && !upcomingOrder && (
          <Link
            href="/customer/orders"
            className="hidden items-center justify-between rounded-xl border border-[#e8e5ef] bg-white px-3 py-3 text-[10px] font-bold text-[#4d4560]"
          >
            <span>View your orders</span>
            <ChevronRight className="h-4 w-4 text-[#6b2be2]" />
          </Link>
        )}
      </main>
      <CustomerBottomNav active="home" />
    </div>
  );
}
