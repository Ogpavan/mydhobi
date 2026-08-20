"use client";

import {
  ArrowLeft,
  Baby,
  Bike,
  Clock3,
  Package,
  Search,
  Shapes,
  ShoppingCart,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import {
  DEFECT_TYPES,
  FABRIC_TYPES,
  PACKING_TYPES,
  readCustomerCart,
  writeCustomerCart,
  type CustomerCartItem,
} from "@/lib/customer-cart";
import type { CatalogService, CatalogVariant, GarmentAudience, ServiceCategory } from "@/lib/service-catalog";
import type { Offer } from "@/lib/offers";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const audienceOptions: Array<{ value: GarmentAudience; label: string; icon: typeof Users }> = [
  { value: "men", label: "Men", icon: UserRound },
  { value: "women", label: "Women", icon: Users },
  { value: "kid", label: "Kid", icon: Baby },
  { value: "other", label: "Other", icon: Shapes },
];

const inputClassName = "h-10 w-full rounded-[9px] border border-[#e1deea] bg-white px-3 text-[11px] font-normal outline-none transition focus:border-[#8a50ee] focus:ring-2 focus:ring-[#8a50ee]/15";
const selectClassName = `${inputClassName} appearance-none`;

function formatUnit(unit: string) {
  return unit === "fixed" ? "item" : unit.replace("_", " ");
}

function itemLabel(garment: ServiceCategory, service: CatalogService, variant: CatalogVariant | null) {
  const variantName = variant && variant.name !== "Standard" ? ` · ${variant.name}` : "";
  return `${garment.name} · ${service.name}${variantName}`;
}

function sameConfiguredItem(left: CustomerCartItem, right: CustomerCartItem) {
  return left.garmentId === right.garmentId &&
    left.serviceId === right.serviceId &&
    left.unitPrice === right.unitPrice &&
    left.alias === right.alias &&
    left.packingType === right.packingType &&
    left.brand === right.brand &&
    left.fabric === right.fabric &&
    left.defect === right.defect;
}

function ServiceIcon({ service, selected, onClick }: { service: CatalogService; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={cn("flex w-[82px] shrink-0 flex-col items-center gap-1.5 rounded-[11px] border px-2 py-2 text-center transition", selected ? "border-[#7440dc] bg-[#f4efff] text-[#7440dc]" : "border-[#ece8f3] bg-white text-[#656779] hover:border-[#cfc0f1]")}>
      {service.imagePath ? <Image src={service.imagePath} alt="" width={42} height={42} className="h-[42px] w-[42px] object-contain" /> : <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#e8ddff] text-[14px] font-bold text-[#7440dc]">{service.name.slice(0, 1)}</span>}
      <span className="line-clamp-2 text-[9px] font-bold leading-tight">{service.name}</span>
    </button>
  );
}

export function ServicesListView({ categories, services, offer }: { categories: ServiceCategory[]; services: CatalogService[]; offer: Offer | null }) {
  const searchParams = useSearchParams();
  const requestedCategoryId = searchParams.get("category");
  const [audience, setAudience] = useState<GarmentAudience>("men");
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [selectedGarment, setSelectedGarment] = useState<ServiceCategory | null>(null);
  const [selectedService, setSelectedService] = useState<CatalogService | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [alias, setAlias] = useState("");
  const [packingType, setPackingType] = useState("");
  const [brand, setBrand] = useState("");
  const [fabric, setFabric] = useState("");
  const [defect, setDefect] = useState("None");

  useEffect(() => {
    const update = () => setCartCount(readCustomerCart()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0);
    update();
    window.addEventListener("mydhobi-cart-change", update);
    return () => window.removeEventListener("mydhobi-cart-change", update);
  }, []);

  useEffect(() => {
    const requested = categories.find((category) => category.id === requestedCategoryId);
    if (requested) setAudience(requested.audience);
    else if (!categories.some((category) => category.audience === audience && category.isActive)) setAudience(categories.find((category) => category.isActive)?.audience ?? "other");
  }, [audience, categories, requestedCategoryId]);

  const visibleGarments = useMemo(() => {
    const search = query.trim().toLowerCase();
    return categories.filter((category) => category.isActive && category.audience === audience && (!search || category.name.toLowerCase().includes(search)));
  }, [audience, categories, query]);
  const garmentServices = useMemo(() => selectedGarment ? services.filter((service) => service.isActive && service.categoryId === selectedGarment.id) : [], [selectedGarment, services]);
  const activeVariants = useMemo(() => selectedService?.variants.filter((variant) => variant.isActive) ?? [], [selectedService]);
  const selectedVariant = activeVariants.find((variant) => variant.id === selectedVariantId) ?? activeVariants[0] ?? null;
  const selectedPrice = selectedVariant?.regularPrice ?? selectedService?.regularPrice ?? 0;
  const selectedUnit = selectedVariant?.unit ?? selectedService?.unit ?? "piece";

  function resetItemDetails() {
    setSelectedVariantId(""); setQuantity(1); setAlias(""); setPackingType(""); setBrand(""); setFabric(""); setDefect("None");
  }

  function openGarment(garment: ServiceCategory) {
    const firstService = services.find((service) => service.isActive && service.categoryId === garment.id) ?? null;
    setSelectedGarment(garment); setSelectedService(firstService); resetItemDetails();
  }

  function closeGarment() {
    setSelectedGarment(null); setSelectedService(null); resetItemDetails();
  }

  function chooseService(service: CatalogService) {
    setSelectedService(service); setSelectedVariantId(service.variants.find((variant) => variant.isActive)?.id ?? ""); setQuantity(1);
  }

  function addToCart() {
    if (!selectedGarment || !selectedService) return;
    const item: CustomerCartItem = {
      name: itemLabel(selectedGarment, selectedService, selectedVariant), quantity, unitPrice: selectedPrice,
      image: selectedService.imagePath || selectedGarment.imagePath || "/wash_fold.png",
      garmentId: selectedGarment.id, garmentName: selectedGarment.name, serviceId: selectedService.id, serviceName: selectedService.name,
      service: `${selectedGarment.name} · ${selectedService.name}`, serviceSlug: selectedService.slug,
      ...(alias.trim() ? { alias: alias.trim() } : {}), ...(packingType ? { packingType } : {}), ...(brand.trim() ? { brand: brand.trim() } : {}),
      ...(fabric ? { fabric } : {}), ...(defect ? { defect } : {}),
    };
    const current = readCustomerCart();
    const existingItems = current?.items ?? [];
    const matchingIndex = existingItems.findIndex((entry) => sameConfiguredItem(entry, item));
    const nextItems = matchingIndex < 0 ? [...existingItems, item] : existingItems.map((entry, index) => index === matchingIndex ? { ...entry, quantity: entry.quantity + quantity } : entry);
    writeCustomerCart({ service: nextItems.length === 1 ? item.service ?? item.name : "Multiple Garments", serviceSlug: nextItems.length === 1 ? item.serviceSlug ?? "" : "", items: nextItems });
    toast.success(`${selectedGarment.name} added`); closeGarment();
  }

  return (
    <div className="min-h-screen bg-[#fafafe] pb-[88px] text-[#17182c]">
      <header className="sticky top-0 z-40 border-b border-[#efedf5] bg-white"><div className="relative mx-auto flex h-14 max-w-[1120px] items-center justify-center px-4"><Link href="/customer" aria-label="Back to home" className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb] sm:left-6"><ArrowLeft className="h-5 w-5" /></Link><h1 className="text-[15px] font-bold">Choose a Garment</h1><Link href="/customer/cart" aria-label="View cart" title="View cart" className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb] sm:right-6"><ShoppingCart className="h-5 w-5" />{cartCount > 0 ? <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7c43e5] px-1 text-[8px] font-bold text-white">{cartCount}</span> : null}</Link></div></header>

      <main className="mx-auto w-full max-w-[1120px] px-3 py-4 sm:px-6"><div className="grid gap-4 lg:grid-cols-[190px_1fr] lg:items-start">
        <aside className="rounded-[14px] border border-[#e8e3f1] bg-white p-2 shadow-[0_3px_10px_rgba(55,48,78,0.04)]"><p className="px-3 pb-2 pt-1 text-[11px] font-bold text-[#656779]">Category</p><div className="grid grid-cols-4 gap-1 lg:grid-cols-1">{audienceOptions.map(({ value, label, icon: Icon }) => { const count = categories.filter((category) => category.isActive && category.audience === value).length; return <button key={value} type="button" onClick={() => { setAudience(value); setQuery(""); }} className={cn("flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[10px] px-2 text-center transition lg:flex-row lg:justify-start lg:gap-3 lg:text-left", audience === value ? "bg-[#f1eaff] text-[#7440dc]" : "text-[#656779] hover:bg-[#faf8ff]")}><span className={cn("flex h-9 w-9 items-center justify-center rounded-full", audience === value ? "bg-[#7440dc] text-white" : "bg-[#f3f0f8] text-[#8b8898]")}><Icon className="h-4 w-4" /></span><span><span className="block text-[10px] font-bold">{label}</span><span className="block text-[9px] text-[#9996a4]">{count} garments</span></span></button>; })}</div></aside>

        <section className="min-w-0"><div className="flex items-center justify-between gap-3"><h2 className="text-[14px] font-bold">Garments</h2><span className="text-[10px] text-[#858796]">{visibleGarments.length} available</span></div><label className="mt-3 flex h-11 min-w-0 items-center gap-2 rounded-[12px] border border-[#e2dfe8] bg-white px-3 focus-within:border-[#8a50ee] focus-within:ring-2 focus-within:ring-[#8a50ee]/15"><Search className="h-4 w-4 shrink-0 text-[#858796]" /><span className="sr-only">Search garments</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search garment" className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#9a9baa]" /></label>{visibleGarments.length ? <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">{visibleGarments.map((garment) => <button key={garment.id} type="button" onClick={() => openGarment(garment)} className="group flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-[12px] border border-[#e7e3ef] bg-white px-2 py-3 text-center transition hover:border-[#cfc0f1] hover:shadow-[0_5px_16px_rgba(116,64,220,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a50ee]">{garment.imagePath ? <Image src={garment.imagePath} alt="" width={70} height={70} className="h-[70px] w-[70px] object-contain transition group-hover:scale-105" /> : <span className="flex h-[70px] w-[70px] items-center justify-center rounded-[12px] bg-[#f0eaff] text-[22px] font-bold text-[#7440dc]">{garment.name.slice(0, 1).toUpperCase()}</span>}<span className="line-clamp-2 text-[10px] font-bold leading-tight">{garment.name}</span></button>)}</div> : <div className="mt-4 rounded-[12px] border border-dashed border-[#dcd8e7] bg-white px-4 py-12 text-center"><Package className="mx-auto h-7 w-7 text-[#8a50ee]" /><p className="mt-3 text-[12px] font-bold">No garments found</p><p className="mt-1 text-[10px] text-[#858796]">Try another group or search word.</p></div>}</section>
      </div>

      {offer ? <Link href="/customer/offers" className="relative mt-5 flex min-h-[88px] w-full items-center overflow-hidden rounded-[12px] bg-[linear-gradient(105deg,#f4efff,#eee6ff)] px-4 text-left"><span className="max-w-[70%]"><strong className="block text-[12px] text-[#7040d7]">{offer.title}</strong><span className="mt-2 block text-[10px] text-[#656779]">Use code: <b className="text-[#7440dc]">{offer.code}</b></span></span><Image src="/gift_box.png" alt="" width={92} height={76} className="absolute -bottom-1 right-1 h-[76px] w-[92px] object-contain" /></Link> : null}
      <section className="mt-5"><h2 className="text-[12px] font-bold">Why Choose Us</h2><div className="mt-3 grid grid-cols-3 gap-2">{[{ label: "Quality Assured", detail: "100% safe", icon: Sparkles }, { label: "Free Pickup", detail: "On all orders", icon: Bike }, { label: "Express Delivery", detail: "In 24 hours", icon: Clock3 }].map((item) => { const Icon = item.icon; return <div key={item.label} className="flex min-w-0 items-center gap-2 rounded-[12px] border border-[#e5e2eb] bg-white px-2 py-3"><Icon className="h-5 w-5 shrink-0 text-[#7440dc]" /><span className="min-w-0"><span className="block text-[8px] font-bold leading-tight sm:text-[10px]">{item.label}</span><span className="mt-1 block text-[7px] text-[#858796] sm:text-[9px]">{item.detail}</span></span></div>; })}</div></section>
      </main>

      <Dialog open={selectedGarment !== null} onOpenChange={(open) => { if (!open) closeGarment(); }}><DialogContent className="max-h-[90vh] max-w-[620px] overflow-hidden rounded-[16px] p-0"><DialogHeader className="border-b border-[#eeeaf4] px-5 py-4 pr-12 text-left"><DialogTitle className="flex items-center gap-3 text-[14px]">{selectedGarment?.imagePath ? <Image src={selectedGarment.imagePath} alt="" width={44} height={44} className="h-11 w-11 object-contain" /> : <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#f0eaff] text-[16px] font-bold text-[#7440dc]">{selectedGarment?.name.slice(0, 1).toUpperCase()}</span>}<span><span className="block">{selectedGarment?.name}</span><span className="mt-1 block text-[10px] font-normal capitalize text-[#858796]">{selectedGarment?.audience}</span></span></DialogTitle></DialogHeader>
        <div className="max-h-[calc(90vh-88px)] space-y-5 overflow-y-auto px-5 py-4"><section><h2 className="text-[11px] font-bold">Select Service</h2>{garmentServices.length ? <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{garmentServices.map((service) => <ServiceIcon key={service.id} service={service} selected={selectedService?.id === service.id} onClick={() => chooseService(service)} />)}</div> : <p className="mt-3 rounded-[10px] bg-[#faf8ff] px-3 py-4 text-[10px] text-[#858796]">No services available for this garment.</p>}</section>
          {selectedService ? <><>{activeVariants.length > 1 ? <section><h2 className="text-[11px] font-bold">Choose Type</h2><div className="mt-2 flex flex-wrap gap-2">{activeVariants.map((variant) => <button key={variant.id} type="button" onClick={() => setSelectedVariantId(variant.id)} className={cn("rounded-[8px] border px-3 py-2 text-[10px] font-semibold", selectedVariant?.id === variant.id ? "border-[#7440dc] bg-[#f1eaff] text-[#7440dc]" : "border-[#e1deea] bg-white text-[#656779]")}>{variant.name}</button>)}</div></section> : null}</>
            <section className="rounded-[12px] border border-[#e5e2eb] bg-white p-3 shadow-[0_3px_10px_rgba(55,48,78,0.04)]"><div className="flex items-center justify-between gap-3"><div><p className="text-[12px] font-bold">{selectedService.name}</p><p className="mt-1 text-[10px] text-[#77798a]">₹{selectedPrice} / {formatUnit(selectedUnit)} · {selectedService.turnaround}</p></div><span className="rounded-full bg-[#f1eaff] px-2 py-1 text-[9px] font-bold text-[#7440dc]">Available</span></div><div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3 border-t border-[#eeeaf4] pt-3"><span className="text-[10px] font-semibold text-[#656779]">Quantity</span><div className="flex items-center gap-2"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity" className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#f1eaff] text-[16px] font-bold text-[#7440dc]">−</button><span className="w-5 text-center text-[12px] font-bold">{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(100, value + 1))} aria-label="Increase quantity" className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#7440dc] text-[16px] font-bold text-white">+</button></div></div></section>
            <section className="grid gap-3 sm:grid-cols-2"><label className="text-[10px] font-bold text-[#31405A]">Alias<input value={alias} onChange={(event) => setAlias(event.target.value)} maxLength={120} className={`${inputClassName} mt-1.5`} placeholder="e.g. Office shirt" /></label><label className="text-[10px] font-bold text-[#31405A]">Packing Type<select value={packingType} onChange={(event) => setPackingType(event.target.value)} className={`${selectClassName} mt-1.5`}><option value="">Select packing</option>{PACKING_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="text-[10px] font-bold text-[#31405A]">Brand<input value={brand} onChange={(event) => setBrand(event.target.value)} maxLength={80} className={`${inputClassName} mt-1.5`} placeholder="Optional" /></label><label className="text-[10px] font-bold text-[#31405A]">Fabric<select value={fabric} onChange={(event) => setFabric(event.target.value)} className={`${selectClassName} mt-1.5`}><option value="">Select fabric</option>{FABRIC_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="text-[10px] font-bold text-[#31405A] sm:col-span-2">Defect<select value={defect} onChange={(event) => setDefect(event.target.value)} className={`${selectClassName} mt-1.5`}>{DEFECT_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></section>
            <button type="button" onClick={addToCart} className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#7440dc] text-[11px] font-bold text-white transition hover:bg-[#6736ca]"><ShoppingCart className="h-4 w-4" />Add to Cart · ₹{selectedPrice * quantity}</button></> : null}
        </div>
      </DialogContent></Dialog>

      <CustomerBottomNav active="services" />
    </div>
  );
}
