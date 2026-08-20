"use client";

import {
  BriefcaseBusiness,
  CheckCircle2,
  CreditCard,
  Home,
  MapPin,
  Minus,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CustomerSimpleHeader } from "@/components/customer/customer-simple-header";
import { startNavigationProgress } from "@/components/navigation-loader";
import { invalidateCustomerData } from "@/components/customer/customer-client-data";
import type { PortalAddress, PortalOrder } from "@/lib/customer-portal";
import {
  cartSubtotal,
  readCustomerCart,
  writeCustomerCart,
  type CustomerCart,
} from "@/lib/customer-cart";
import type { CatalogService } from "@/lib/service-catalog";
import { cn } from "@/lib/utils";

export function ServiceDetailsView({ service }: { service: CatalogService }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [cartHydrated, setCartHydrated] = useState(false);
  const router = useRouter();
  const cartImage = service.imagePath || service.garmentImagePath || "/wash_fold.png";
  const pricedItems = service.variants
    .filter((variant) => variant.isActive)
    .map((variant) => ({
      name: variant.name === "Standard"
        ? `${service.garmentName} · ${service.name}`
        : `${service.garmentName} · ${service.name} · ${variant.name}`,
      price: variant.regularPrice,
      unit: variant.unit,
      image: cartImage,
    }));
  const totalItems = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const total = pricedItems.reduce((sum, item) => sum + (counts[item.name] ?? 0) * item.price, 0);

  useEffect(() => {
    const cart = readCustomerCart();
    if (!cart) {
      setCartHydrated(true);
      return;
    }
    const serviceItems = cart.items.filter(
      (item) => (item.serviceSlug ?? cart.serviceSlug) === service.slug,
    );
    setCounts(Object.fromEntries(serviceItems.map((item) => [item.name, item.quantity])));
    setCartHydrated(true);
  }, [service.slug]);

  function selectedItems(nextCounts: Record<string, number>) {
    return pricedItems.flatMap((item) => {
      const quantity = nextCounts[item.name] ?? 0;
      return quantity > 0 ? [{ ...item, quantity, unitPrice: item.price }] : [];
    });
  }

  function saveSelection(nextCounts: Record<string, number>) {
    if (!cartHydrated) return;
    const items = selectedItems(nextCounts);
    const currentCart = readCustomerCart();
    const existingItems = currentCart?.items ?? [];
    const otherServiceItems = existingItems.filter(
      (item) => (item.serviceSlug ?? currentCart?.serviceSlug) !== service.slug,
    );
    const nextItems = [
      ...otherServiceItems,
      ...items.map(({ name, quantity, unitPrice, image }) => ({
        name,
        quantity,
        unitPrice,
        image,
        service: service.name,
        serviceSlug: service.slug,
      })),
    ];
    const hasMultipleServices = otherServiceItems.length > 0;
    writeCustomerCart(nextItems.length ? {
      service: hasMultipleServices ? "Multiple Garments" : `${service.garmentName} · ${service.name}`,
      serviceSlug: hasMultipleServices ? "" : service.slug,
      items: nextItems,
    } : null);
  }

  function addToCart() {
    const items = selectedItems(counts);
    if (!items.length) {
      toast.error("Add at least one item");
      return;
    }
    saveSelection(counts);
    startNavigationProgress();
    router.push("/customer/cart");
  }

  return (
    <div className="min-h-screen bg-[#fafafe] pb-24 text-[#17182c]">
      <CustomerSimpleHeader
        title="Choose Service"
        backHref="/customer/services"
        action={
          <Link href="/customer/cart" aria-label="View cart" className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb]">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7440dc] px-1 text-[8px] font-bold text-white">{totalItems}</span>}
          </Link>
        }
      />
      <main className="mx-auto max-w-[720px] px-4 py-4">
        <section className="relative flex min-h-[116px] overflow-hidden rounded-[12px] bg-[linear-gradient(110deg,#f5f1ff,#ece5ff)] px-4 py-4">
          <div className="max-w-[62%]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7440dc]">{service.name}</p>
            <h2 className="mt-2 text-[18px] font-bold">{service.garmentName}</h2>
            <p className="mt-2 text-[12px] text-[#656779]">
              ₹{service.regularPrice}/{service.unit}
            </p>
          </div>
          <Image src={cartImage} alt="" width={110} height={105} className="absolute bottom-0 right-3 h-[105px] w-[110px] object-contain" />
        </section>

        <section className="mt-5 space-y-2">
          <h2 className="text-[12px] font-bold">Add {service.garmentName}</h2>
          {pricedItems.map((item) => {
            const count = counts[item.name] ?? 0;
            return (
              <div key={item.name} className="flex items-center gap-3 rounded-[12px] border border-[#e5e2eb] bg-white px-3 py-2">
                <Image src={item.image || "/wash_fold.png"} alt="" width={46} height={46} className="h-[46px] w-[46px] object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold">{service.name}{item.name.endsWith(` · ${service.name}`) ? "" : ` · ${item.name.split(" · ").slice(-1)[0]}`}</p>
                  <p className="mt-1 text-[9px] text-[#77798a]">₹{item.price}/{item.unit.replace("_", " ")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label={`Remove ${item.name}`} onClick={() => { const next = { ...counts, [item.name]: Math.max(0, count - 1) }; setCounts(next); saveSelection(next); }} className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#f1eaff] text-[#7440dc]"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-4 text-center text-[11px] font-bold">{count}</span>
                  <button type="button" aria-label={`Add ${item.name}`} onClick={() => { const next = { ...counts, [item.name]: count + 1 }; setCounts(next); saveSelection(next); }} className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#7440dc] text-white"><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            );
          })}
        </section>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8e5ed] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-[720px] items-center justify-between rounded-[12px] bg-[#7440dc] px-4 py-2 text-white">
          <span className="text-[11px] font-bold">{totalItems} items · ₹{total}</span>
          <button type="button" onClick={addToCart} className="rounded-[8px] bg-white/15 px-4 py-2 text-[11px] font-bold">Add to Cart</button>
        </div>
      </div>
    </div>
  );
}

export function CartView() {
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applying, setApplying] = useState(false);
  const [cart,setCart]=useState<CustomerCart|null>(null);
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{setCart(readCustomerCart());setLoaded(true);const saved=Number(localStorage.getItem("mydhobi_discount")??0);if(Number.isFinite(saved))setDiscount(saved);setCoupon(localStorage.getItem("mydhobi_coupon")??"");},[]);
  const subtotal=cartSubtotal(cart);
  function updateQuantity(index:number,quantity:number){
    if(!cart)return;
    const next={...cart,items:cart.items.flatMap((item,itemIndex)=>itemIndex===index?(quantity>0?[{...item,quantity}]:[]):[item])};
    const value=next.items.length?next:null;setCart(value);writeCustomerCart(value);
    setDiscount(0);setCoupon("");localStorage.removeItem("mydhobi_coupon");localStorage.removeItem("mydhobi_discount");
  }
  async function applyCoupon() {
    if (!coupon.trim()) { toast.error("Enter a coupon code"); return; }
    setApplying(true);
    const request=await fetch("/api/customer/offers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:coupon,subtotal})});
    const data=await request.json() as {discount?:number;offer?:{code:string};message?:string};
    setApplying(false);
    if(!request.ok||!data.offer){setDiscount(0);localStorage.removeItem("mydhobi_coupon");localStorage.removeItem("mydhobi_discount");toast.error(data.message??"Coupon is not valid");return;}
    setDiscount(data.discount??0);setCoupon(data.offer.code);localStorage.setItem("mydhobi_coupon",data.offer.code);localStorage.setItem("mydhobi_discount",String(data.discount??0));toast.success(`You saved ₹${data.discount??0}`);
  }
  return (
    <div className="min-h-screen bg-[#fafafe] pb-24 text-[#17182c]">
      <CustomerSimpleHeader title="My Cart" backHref={cart?.serviceSlug ? `/customer/services/${cart.serviceSlug}` : "/customer/services"} />
      <main className="mx-auto max-w-[720px] space-y-3 px-4 py-4">
        {loaded&&!cart?<p className="rounded-[12px] border border-dashed border-[#d8d4e2] bg-white px-4 py-12 text-center text-[11px] text-[#77798a]">Your cart is empty</p>:null}
        {cart?.items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="flex items-center gap-3 rounded-[12px] border border-[#e5e2eb] bg-white px-3 py-3">
            <Image src={item.image || "/wash_fold.png"} alt="" width={44} height={44} className="h-11 w-11 object-contain" />
            <div className="min-w-0 flex-1"><p className="text-[11px] font-bold">{item.name}</p><p className="mt-1 text-[9px] text-[#77798a]">₹{item.unitPrice} × {item.quantity}</p>{[item.alias, item.packingType, item.brand, item.fabric, item.defect && item.defect !== "None" ? item.defect : ""].filter(Boolean).length ? <p className="mt-1 truncate text-[9px] text-[#8a8898]">{[item.alias, item.packingType, item.brand, item.fabric, item.defect && item.defect !== "None" ? item.defect : ""].filter(Boolean).join(" · ")}</p> : null}</div>
            <div className="flex items-center gap-2"><button type="button" onClick={()=>updateQuantity(index,item.quantity-1)} aria-label={`Remove one ${item.name}`} className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#f1eaff] text-[#7440dc]"><Minus className="h-3.5 w-3.5" /></button><b className="w-4 text-center text-[11px]">{item.quantity}</b><button type="button" onClick={()=>updateQuantity(index,item.quantity+1)} aria-label={`Add one ${item.name}`} className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#7440dc] text-white"><Plus className="h-3.5 w-3.5" /></button><button type="button" onClick={()=>updateQuantity(index,0)} aria-label={`Remove ${item.name}`} className="ml-1 text-[#df4651]"><Trash2 className="h-4 w-4" /></button></div>
          </div>
        ))}
        <Link href="/customer/services" className="flex h-10 items-center justify-center gap-1 rounded-[10px] border border-[#8a50ee] text-[10px] font-bold text-[#7440dc]"><Plus className="h-3.5 w-3.5" /> Add More Garments</Link>
        <section className="rounded-[12px] border border-[#e5e2eb] bg-white p-3">
          <h2 className="text-[11px] font-bold">Apply Coupon</h2>
          <div className="mt-2 flex gap-2"><input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="h-10 min-w-0 flex-1 rounded-[9px] border border-[#e1deea] px-3 text-[10px] outline-none focus:border-[#8a50ee]" /><button type="button" disabled={applying} onClick={applyCoupon} className="rounded-[9px] border border-[#8a50ee] px-4 text-[10px] font-bold text-[#7440dc] disabled:opacity-60">{applying?"Checking...":"Apply"}</button></div>
        </section>
        <section className="rounded-[12px] border border-[#e5e2eb] bg-white p-3">
          <h2 className="text-[11px] font-bold">Price Details</h2>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-2 text-[10px]"><dt className="text-[#77798a]">Item Total</dt><dd>₹{subtotal}</dd><dt className="text-[#77798a]">Pickup Charges</dt><dd className="text-[#23a84f]">FREE</dd>{discount>0?<><dt className="text-[#77798a]">Coupon Discount</dt><dd className="text-[#23a84f]">-₹{discount}</dd></>:null}<dt className="border-t pt-3 font-bold">Total Amount</dt><dd className="border-t pt-3 font-bold">₹{subtotal-discount}</dd></dl>
        </section>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8e5ed] bg-white p-3">{cart?<Link href="/customer/addresses" className="mx-auto flex h-12 max-w-[720px] items-center justify-center rounded-[12px] bg-[#7440dc] text-[12px] font-bold text-white">Proceed to Checkout</Link>:<Link href="/customer/services" className="mx-auto flex h-12 max-w-[720px] items-center justify-center rounded-[12px] bg-[#7440dc] text-[12px] font-bold text-white">Choose a Garment</Link>}</div>
    </div>
  );
}

export function AddressesView({ addresses }: { addresses: PortalAddress[] }) {
  const [addressList,setAddressList]=useState(addresses);
  const [selected, setSelected] = useState(addresses[0]?.id ?? "");
  function selectAddress(address: PortalAddress) {
    setSelected(address.id);
    localStorage.setItem(
      "mydhobi_checkout_address",
      [address.fullAddress, address.landmark, address.city, address.pincode].filter(Boolean).join(", "),
    );
  }
  async function removeAddress(id:string){
    if(!confirm("Delete this address?"))return;
    const request=await fetch(`/api/customer/addresses/${id}`,{method:"DELETE"});
    if(!request.ok){toast.error("Unable to delete address");return;}
    const next=addressList.filter(item=>item.id!==id);setAddressList(next);
    invalidateCustomerData("/api/customer/addresses", "/api/customer/home");
    if(selected===id)setSelected(next[0]?.id??"");
    toast.success("Address deleted");
  }
  return (
    <div className="min-h-screen bg-[#fafafe] pb-24 text-[#17182c]">
      <CustomerSimpleHeader title="My Addresses" backHref="/customer/cart" />
      <main className="mx-auto max-w-[720px] space-y-3 px-4 py-4">
        {!addressList.length && <p className="rounded-[12px] border border-dashed border-[#d8d4e2] bg-white px-4 py-10 text-center text-[11px] text-[#77798a]">No saved addresses</p>}
        {addressList.map((address) => {
          const Icon = address.type === "Office" ? BriefcaseBusiness : Home;
          return <article key={address.id} className={cn("flex items-start gap-2 rounded-[12px] border bg-white p-2", selected === address.id ? "border-[#7440dc]" : "border-[#e5e2eb]")}><button type="button" onClick={() => selectAddress(address)} className="flex min-w-0 flex-1 items-start gap-3 px-1 py-1 text-left"><Icon className="mt-0.5 h-5 w-5 text-[#7440dc]" /><span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-[11px] font-bold">{address.type}{address.isDefault && <b className="rounded bg-[#dff7e6] px-1.5 py-0.5 text-[8px] text-[#279c4e]">Default</b>}</span><span className="mt-2 block text-[9px] leading-4 text-[#77798a]">{address.fullAddress}, {address.city} - {address.pincode}</span></span></button><Link href={`/customer/addresses/${address.id}/edit`} aria-label={`Edit ${address.type} address`} className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#7440dc] hover:bg-[#f4efff]"><Pencil className="h-4 w-4" /></Link><button type="button" onClick={()=>void removeAddress(address.id)} aria-label={`Delete ${address.type} address`} className="flex h-8 w-8 items-center justify-center rounded-[8px] text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></article>;
        })}
      </main>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8e5ed] bg-white p-3"><Link href="/customer/addresses/new" className="mx-auto flex h-11 max-w-[720px] items-center justify-center gap-1 rounded-[12px] border border-[#8a50ee] text-[11px] font-bold text-[#7440dc]"><Plus className="h-3.5 w-3.5" /> Add New Address</Link>{addressList.length > 0 && <Link href="/customer/payment" onClick={() => { const address = addressList.find((item) => item.id === selected) ?? addressList[0]; selectAddress(address); }} className="mx-auto mt-2 flex h-11 max-w-[720px] items-center justify-center rounded-[12px] bg-[#7440dc] text-[11px] font-bold text-white">Continue</Link>}</div>
    </div>
  );
}

export function AddAddressView({address}:{address?:PortalAddress}) {
  const [type, setType] = useState(address?.type??"Home");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  async function saveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch(address?`/api/customer/addresses/${address.id}`:"/api/customer/addresses", {
      method: address?"PATCH":"POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, fullAddress: form.get("fullAddress"), landmark: form.get("landmark"), city: form.get("city"), pincode: form.get("pincode"), isDefault: form.get("isDefault") === "on" }),
    });
    const data = await response.json() as { message?: string };
    if (!response.ok) {
      toast.error(data.message ?? "Unable to save address");
      setSaving(false);
      return;
    }
    invalidateCustomerData("/api/customer/addresses", "/api/customer/home");
    startNavigationProgress();
    router.push("/customer/addresses");
  }
  return (
    <div className="min-h-screen bg-[#fafafe] pb-24 text-[#17182c]">
      <CustomerSimpleHeader title={address?"Edit Address":"Add New Address"} backHref="/customer/addresses" />
      <form className="mx-auto max-w-[720px] space-y-4 px-4 py-4" onSubmit={saveAddress}>
        <fieldset><legend className="text-[10px] font-bold">Address Type</legend><div className="mt-2 grid grid-cols-3 gap-2">{["Home", "Office", "Other"].map((item) => <button key={item} type="button" onClick={() => setType(item)} className={cn("h-10 rounded-[10px] border text-[10px] font-bold", type === item ? "border-[#7440dc] bg-[#f4efff] text-[#7440dc]" : "border-[#e1deea] bg-white")}>{item}</button>)}</div></fieldset>
        {[["Full Address", "House / Flat / Building, Street...", "fullAddress",address?.fullAddress??""], ["Landmark (Optional)", "E.g. Near ITPL Main Gate", "landmark",address?.landmark??""], ["City", "Bengaluru", "city",address?.city??""], ["Pincode", "560066", "pincode",address?.pincode??""]].map(([label, placeholder, name,value]) => <label key={label} className="block text-[10px] font-bold">{label}<input name={name} defaultValue={value} required={!label.includes("Optional")} inputMode={name === "pincode" ? "numeric" : undefined} pattern={name==="pincode"?"[0-9]{6}":undefined} maxLength={name === "pincode" ? 6 : undefined} onInput={name==="pincode"?event=>{event.currentTarget.value=event.currentTarget.value.replace(/\D/g,"").slice(0,6)}:undefined} placeholder={placeholder} className="mt-2 h-11 w-full rounded-[10px] border border-[#e1deea] bg-white px-3 text-[11px] font-normal outline-none focus:border-[#8a50ee]" /></label>)}
        <label className="flex items-center justify-between text-[10px] font-bold">Set as default address<input name="isDefault" type="checkbox" defaultChecked={address?.isDefault??false} className="h-5 w-5 accent-[#7440dc]" /></label>
        <button type="submit" disabled={saving} className="fixed inset-x-4 bottom-3 mx-auto h-12 max-w-[688px] rounded-[12px] bg-[#7440dc] text-[12px] font-bold text-white disabled:opacity-60">{saving ? "Saving..." : address?"Update Address":"Save Address"}</button>
      </form>
    </div>
  );
}

export function PaymentView({ walletBalance }: { walletBalance: number }) {
  const [method, setMethod] = useState("UPI");
  const [isPaying, setIsPaying] = useState(false);
  const [total,setTotal]=useState(0);
  const [cart,setCart]=useState<CustomerCart|null>(null);
  const router = useRouter();
  useEffect(()=>{const current=readCustomerCart();setCart(current);const saved=Number(localStorage.getItem("mydhobi_discount")??0);setTotal(Math.max(0,cartSubtotal(current)-(Number.isFinite(saved)?saved:0)));},[]);
  const methods = [{ label: "UPI", detail: "Google Pay, PhonePe etc.", icon: CreditCard }, { label: "Wallet", detail: `Available balance: ₹${walletBalance.toFixed(2)}`, icon: WalletCards }, { label: "Debit / Credit Card", detail: "Visa, Mastercard, RuPay", icon: CreditCard }, { label: "Cash on Delivery", detail: "Pay when we deliver", icon: WalletCards }];
  async function placeOrder() {
    if(!cart){toast.error("Your cart is empty");startNavigationProgress();router.push("/customer/services");return;}
    const checkoutAddress=localStorage.getItem("mydhobi_checkout_address");
    if(!checkoutAddress){toast.error("Select a pickup address");startNavigationProgress();router.push("/customer/addresses");return;}
    setIsPaying(true);
    const savedPickup = localStorage.getItem("mydhobi_pickup_at");
    const pickup = savedPickup ? new Date(savedPickup) : new Date();
    if (!savedPickup) {
      pickup.setDate(pickup.getDate() + 1);
      pickup.setHours(10, 0, 0, 0);
    }
    const response = await fetch("/api/customer/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: cart.service,
        pickupAt: pickup.toISOString(),
        paymentMethod: method === "Wallet" ? "wallet" : method === "Cash on Delivery" ? "cash" : method === "Debit / Credit Card" ? "card" : "upi",
        address: checkoutAddress,
        instructions: localStorage.getItem("mydhobi_pickup_instructions") ?? "",
        couponCode: localStorage.getItem("mydhobi_coupon") ?? "",
        items: cart.items.map((item)=>({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          garmentId: item.garmentId,
          garmentName: item.garmentName,
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          alias: item.alias,
          packingType: item.packingType,
          brand: item.brand,
          fabric: item.fabric,
          defect: item.defect,
        })),
      }),
    });
    const data = await response.json() as { order?: { id: string }; message?: string };
    if (!response.ok || !data.order) {
      toast.error(data.message ?? "Unable to place order");
      setIsPaying(false);
      return;
    }
    invalidateCustomerData(
      "/api/customer/orders",
      "/api/customer/wallet",
      "/api/customer/notifications",
      "/api/customer/home",
    );
    startNavigationProgress();
    localStorage.removeItem("mydhobi_coupon");
    localStorage.removeItem("mydhobi_discount");
    writeCustomerCart(null);
    router.push(`/customer/order-success?order=${encodeURIComponent(data.order.id)}`);
  }
  return (
    <div className="min-h-screen bg-[#fafafe] pb-24 text-[#17182c]"><CustomerSimpleHeader title="Payment Method" backHref="/customer/addresses" /><main className="mx-auto max-w-[720px] space-y-3 px-4 py-4">{methods.map((item) => { const Icon=item.icon; return <button key={item.label} type="button" onClick={() => setMethod(item.label)} className={cn("flex w-full items-center gap-3 rounded-[12px] border bg-white px-3 py-3 text-left", method===item.label ? "border-[#8a50ee] bg-[#fbf9ff]" : "border-[#e5e2eb]")}><span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#f0eaff] text-[#7440dc]"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold">{item.label}</span><span className="mt-1 block text-[9px] text-[#77798a]">{item.detail}</span></span><span className={cn("h-4 w-4 rounded-full border-2", method===item.label ? "border-[#7440dc] bg-[#7440dc] shadow-[inset_0_0_0_3px_white]" : "border-[#c8c7d1]")} /></button>})}</main><div className="fixed inset-x-0 bottom-0 bg-white p-3"><button type="button" disabled={isPaying||!cart} onClick={placeOrder} className="mx-auto flex h-12 w-full max-w-[720px] items-center justify-center rounded-[12px] bg-[#7440dc] text-[12px] font-bold text-white disabled:opacity-60">{isPaying ? "Placing Order..." : cart?`Pay ₹${total}`:"Cart is Empty"}</button></div></div>
  );
}

export function OrderSuccessView({ order }: { order: PortalOrder }) {
  return (
    <div className="min-h-screen bg-[#fafafe] text-[#17182c]"><main className="mx-auto flex min-h-screen max-w-[720px] flex-col items-center justify-center px-4 py-8 text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#28b65a] text-white shadow-[0_8px_20px_rgba(36,179,87,0.25)]"><CheckCircle2 className="h-12 w-12" /></span><h1 className="mt-6 text-[18px] font-bold">Order Placed Successfully!</h1><div className="mt-5 rounded-[12px] bg-[#eee8ff] px-7 py-3"><p className="text-[9px] text-[#7440dc]">Order ID</p><p className="mt-1 text-[14px] font-bold">#{order.id}</p></div><section className="mt-5 w-full rounded-[12px] border border-[#e5e2eb] bg-white p-3 text-left"><div className="flex gap-3 text-[10px]"><MapPin className="h-4 w-4 text-[#7440dc]" /><span>Your pickup is set for {new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata"}).format(new Date(order.pickupAt))}.<br />{order.address}<br />Amount: ₹{order.amount}</span></div></section><div className="mt-6 w-full space-y-2"><Link href={`/customer/orders/${order.id}`} className="flex h-12 items-center justify-center rounded-[12px] bg-[#7440dc] text-[12px] font-bold text-white">Track Order</Link><Link href="/customer" className="flex h-12 items-center justify-center rounded-[12px] border border-[#8a50ee] text-[12px] font-bold text-[#7440dc]">Back to Home</Link></div></main></div>
  );
}
