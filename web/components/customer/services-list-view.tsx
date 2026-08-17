"use client";

import {
  ArrowLeft,
  Bike,
  Clock3,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import type {
  CatalogService,
  ServiceCategory,
} from "@/lib/service-catalog";
import { readCustomerCart } from "@/lib/customer-cart";
import type { Offer } from "@/lib/offers";
import { cn } from "@/lib/utils";

export function ServicesListView({
  categories,
  services,
  offer,
}: {
  categories: ServiceCategory[];
  services: CatalogService[];
  offer: Offer | null;
}) {
  const searchParams = useSearchParams();
  const requestedCategoryId = searchParams.get("category");
  const [categoryId, setCategoryId] = useState("all");
  const [query, setQuery] = useState("");
  const [cartCount,setCartCount]=useState(0);
  useEffect(()=>{const update=()=>setCartCount(readCustomerCart()?.items.reduce((sum,item)=>sum+item.quantity,0)??0);update();window.addEventListener("mydhobi-cart-change",update);return()=>window.removeEventListener("mydhobi-cart-change",update);},[]);
  useEffect(() => {
    setCategoryId(
      requestedCategoryId && categories.some((category) => category.id === requestedCategoryId)
        ? requestedCategoryId
        : "all",
    );
  }, [categories, requestedCategoryId]);

  const visibleServices = useMemo(() => {
    const search = query.trim().toLowerCase();
    return services.filter((service) => {
      const categoryMatches =
        categoryId === "all" || service.categoryId === categoryId;
      const searchMatches =
        !search ||
        service.name.toLowerCase().includes(search) ||
        service.categoryName.toLowerCase().includes(search);
      return categoryMatches && searchMatches;
    });
  }, [categoryId, query, services]);

  return (
    <div className="min-h-screen bg-[#fafafe] pb-[88px] text-[#17182c]">
      <header className="sticky top-0 z-40 border-b border-[#efedf5] bg-white">
        <div className="relative mx-auto flex h-14 max-w-[720px] items-center justify-center px-4">
          <Link
            href="/customer"
            aria-label="Back to home"
            className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[15px] font-bold">Our Services</h1>
          <Link
            href="/customer/cart"
            aria-label="View cart"
            title="View cart"
            className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb]"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7c43e5] px-1 text-[8px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-3 py-4">
        <div className="flex gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[12px] border border-[#e2dfe8] bg-white px-3 focus-within:border-[#8a50ee] focus-within:ring-2 focus-within:ring-[#8a50ee]/15">
            <Search className="h-4 w-4 shrink-0 text-[#858796]" />
            <span className="sr-only">Search services</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services..."
              className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#9a9baa]"
            />
          </label>
        </div>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {[
            { id: "all", name: "All Services", imagePath: "/wash_fold.png" },
            ...categories,
          ].map((item) => {
            const selected = categoryId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategoryId(item.id)}
                className={cn(
                  "flex w-[72px] shrink-0 flex-col items-center justify-center rounded-[10px] px-1 py-2 text-center transition",
                  selected ? "bg-[linear-gradient(145deg,#8249eb,#7138df)] text-white" : "text-[#4e5060] hover:bg-white",
                )}
              >
                {item.imagePath ? (
                  <Image src={item.imagePath} alt="" width={34} height={34} className="h-[34px] w-[34px] object-contain" />
                ) : (
                  <span className={cn("flex h-[34px] w-[34px] items-center justify-center rounded-[9px]", selected ? "bg-white/15" : "bg-[#f0eaff] text-[#7440dc]")}>
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                )}
                <span className="mt-1 line-clamp-2 text-[8px] font-semibold leading-tight sm:text-[9px]">{item.name}</span>
              </button>
            );
          })}
        </div>

        <section className="mt-4 space-y-2.5">
          {visibleServices.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[#dcd8e7] bg-white px-4 py-10 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-[#8a50ee]" />
              <p className="mt-3 text-[12px] font-bold">No services found</p>
            </div>
          ) : (
            visibleServices.map((service) => {
              const price = `₹${service.regularPrice}/${service.unit}`;
              return (
                <article key={service.id} className="flex min-h-[104px] items-center gap-3 rounded-[12px] border border-[#e5e2eb] bg-white px-3 py-3 shadow-[0_3px_10px_rgba(55,48,78,0.04)]">
                  <Link href={`/customer/services/${service.slug}`} aria-label={`View ${service.name}`}>
                    <Image src={service.imagePath || "/wash_fold.png"} alt="" width={68} height={68} className="h-[68px] w-[68px] shrink-0 object-contain" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[13px] font-bold">
                      <Link href={`/customer/services/${service.slug}`}>{service.name}</Link>
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-[#f5f2fb] px-2 py-1 text-[9px] text-[#656779]">
                        <Clock3 className="h-3 w-3" />
                        {service.turnaround}
                      </span>
                      <span className="rounded-full bg-[#f5f2fb] px-2 py-1 text-[9px] font-semibold text-[#7440dc]">{price}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[8px] text-[#858796]">Starting from</p>
                    <p className="mt-1 text-[14px] font-bold">{price}</p>
                    <Link
                      href={`/customer/services/${service.slug}`}
                      className="mt-2 flex h-8 min-w-[58px] items-center justify-center rounded-[8px] bg-[#7440dc] px-3 text-[10px] font-bold text-white"
                    >
                      Choose
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {offer?<Link
          href="/customer/offers"
          className="relative mt-4 flex min-h-[88px] w-full items-center overflow-hidden rounded-[12px] bg-[linear-gradient(105deg,#f4efff,#eee6ff)] px-4 text-left"
        >
          <span className="max-w-[70%]">
            <strong className="block text-[12px] text-[#7040d7]">{offer.title}</strong>
            <span className="mt-2 block text-[10px] text-[#656779]">Use code: <b className="text-[#7440dc]">{offer.code}</b></span>
          </span>
          <Image src="/gift_box.png" alt="" width={92} height={76} className="absolute -bottom-1 right-1 h-[76px] w-[92px] object-contain" />
        </Link>:null}

        <section className="mt-4">
          <h2 className="text-[12px] font-bold">Why Choose Us</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Quality Assured", detail: "100% safe", icon: ShieldCheck },
              { label: "Free Pickup", detail: "On all orders", icon: Bike },
              { label: "Express Delivery", detail: "In 24 hours", icon: Clock3 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex min-w-0 items-center gap-2 rounded-[12px] border border-[#e5e2eb] bg-white px-2 py-3">
                  <Icon className="h-5 w-5 shrink-0 text-[#7440dc]" />
                  <span className="min-w-0">
                    <span className="block text-[8px] font-bold leading-tight sm:text-[10px]">{item.label}</span>
                    <span className="mt-1 block text-[7px] text-[#858796] sm:text-[9px]">{item.detail}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <CustomerBottomNav active="services" />
    </div>
  );
}
