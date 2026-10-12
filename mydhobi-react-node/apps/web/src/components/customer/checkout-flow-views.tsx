import { MuiAction, MuiInput } from "@/components/ui/native-controls";
import { apiFetch } from "@/platform/http";
import Image from "@/platform/image";
import Link, { useRouter } from "@/platform/navigation";
import { toast } from "@/platform/notifications";
import {
  BriefcaseBusiness,
  Check,
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
import { useEffect, useRef, useState } from "react";

import { invalidateCustomerData } from "@/components/customer/customer-client-data";
import { CustomerSimpleHeader } from "@/components/customer/customer-simple-header";
import { startNavigationProgress } from "@/components/navigation-loader";
import {
  cartSubtotal,
  readCustomerCart,
  writeCustomerCart,
  type CustomerCart,
} from "@/lib/customer-cart";
import type { PortalAddress, PortalOrder } from "@/lib/customer-portal";
import type { CatalogService } from "@/lib/service-catalog";
import { cn } from "@/lib/utils";
import { useOrderingDraft } from "./ordering-state";

export function ServiceDetailsView({ service }: { service: CatalogService }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [cartHydrated, setCartHydrated] = useState(false);
  const router = useRouter();
  const cartImage =
    service.imagePath || service.garmentImagePath || "/wash_fold.png";
  const pricedItems = service.variants
    .filter((variant) => variant.isActive)
    .map((variant) => ({
      name:
        variant.name === "Standard"
          ? `${service.garmentName} · ${service.name}`
          : `${service.garmentName} · ${service.name} · ${variant.name}`,
      price: variant.regularPrice,
      unit: variant.unit,
      image: cartImage,
    }));
  const totalItems = Object.values(counts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const total = pricedItems.reduce(
    (sum, item) => sum + (counts[item.name] ?? 0) * item.price,
    0,
  );

  useEffect(() => {
    const cart = readCustomerCart();
    if (!cart) {
      setCartHydrated(true);
      return;
    }
    const serviceItems = cart.items.filter(
      (item) => (item.serviceSlug ?? cart.serviceSlug) === service.slug,
    );
    setCounts(
      Object.fromEntries(
        serviceItems.map((item) => [item.name, item.quantity]),
      ),
    );
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
        garmentId: service.garmentId,
        garmentName: service.garmentName,
        serviceId: service.id,
        serviceName: service.name,
        service: service.name,
        serviceSlug: service.slug,
      })),
    ];
    const hasMultipleServices = otherServiceItems.length > 0;
    writeCustomerCart(
      nextItems.length
        ? {
            service: hasMultipleServices
              ? "Multiple Garments"
              : `${service.garmentName} · ${service.name}`,
            serviceSlug: hasMultipleServices ? "" : service.slug,
            items: nextItems,
          }
        : null,
    );
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
    <div className="min-h-screen bg-[#fafafe] pb-28 text-[#17182c]">
      <CustomerSimpleHeader
        title="Service Details"
        backHref="/customer/services"
        action={
          <Link
            href="/customer/cart"
            aria-label="View cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb]"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7440dc] px-1 text-[8px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>
        }
      />
      <main className="mx-auto max-w-[720px] px-4 py-4">
        <section className="relative flex min-h-[116px] overflow-hidden rounded-[12px] bg-[linear-gradient(110deg,#f5f1ff,#ece5ff)] px-4 py-4">
          <div className="max-w-[62%]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7440dc]">
              {service.name}
            </p>
            <h2 className="mt-2 text-[18px] font-bold">
              {service.garmentName}
            </h2>
            <p className="mt-2 text-[12px] text-[#656779]">
              ₹{service.regularPrice}/{service.unit}
            </p>
          </div>
          <Image
            src={cartImage}
            alt=""
            width={110}
            height={105}
            className="absolute bottom-0 right-3 h-[105px] w-[110px] object-contain"
          />
        </section>

        <section className="mt-5 space-y-2">
          <h2 className="text-[12px] font-bold">Add {service.garmentName}</h2>
          {pricedItems.map((item) => {
            const count = counts[item.name] ?? 0;
            return (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-[12px] border border-[#e5e2eb] bg-white px-3 py-2"
              >
                <Image
                  src={item.image || "/wash_fold.png"}
                  alt=""
                  width={46}
                  height={46}
                  className="h-[46px] w-[46px] object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold">
                    {service.name}
                    {item.name.endsWith(` · ${service.name}`)
                      ? ""
                      : ` · ${item.name.split(" · ").slice(-1)[0]}`}
                  </p>
                  <p className="mt-1 text-[9px] text-[#77798a]">
                    ₹{item.price}/{item.unit.replace("_", " ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <MuiAction
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => {
                      const next = {
                        ...counts,
                        [item.name]: Math.max(0, count - 1),
                      };
                      setCounts(next);
                      saveSelection(next);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#f1eaff] text-[#7440dc]"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </MuiAction>
                  <span className="w-4 text-center text-[11px] font-bold">
                    {count}
                  </span>
                  <MuiAction
                    type="button"
                    aria-label={`Add ${item.name}`}
                    onClick={() => {
                      const next = { ...counts, [item.name]: count + 1 };
                      setCounts(next);
                      saveSelection(next);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#7440dc] text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </MuiAction>
                </div>
              </div>
            );
          })}
        </section>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8e5ed] bg-white">
        <div className="mx-auto flex min-h-[78px] max-w-[720px] items-center justify-between bg-[#7040dc] px-5 text-white">
          <span className="text-[15px] font-semibold">
            {totalItems} items · ₹{total}
          </span>
          <MuiAction
            type="button"
            onClick={addToCart}
            className="min-h-11 rounded-[8px] bg-white/20 px-5 text-[15px] font-bold"
          >
            Add to Cart
          </MuiAction>
        </div>
      </div>
    </div>
  );
}

export function CartView() {
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applying, setApplying] = useState(false);
  const [cart, setCart] = useState<CustomerCart | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setCart(readCustomerCart());
    setLoaded(true);
    const saved = Number(localStorage.getItem("mydhobi_discount") ?? 0);
    if (Number.isFinite(saved)) setDiscount(saved);
    setCoupon(localStorage.getItem("mydhobi_coupon") ?? "");
  }, []);
  const subtotal = cartSubtotal(cart);
  function updateQuantity(index: number, quantity: number) {
    if (!cart) return;
    const next = {
      ...cart,
      items: cart.items.flatMap((item, itemIndex) =>
        itemIndex === index
          ? quantity > 0
            ? [{ ...item, quantity }]
            : []
          : [item],
      ),
    };
    const value = next.items.length ? next : null;
    setCart(value);
    writeCustomerCart(value);
    setDiscount(0);
    setCoupon("");
    localStorage.removeItem("mydhobi_coupon");
    localStorage.removeItem("mydhobi_discount");
  }
  async function applyCoupon() {
    if (!coupon.trim()) {
      toast.error("Enter a coupon code");
      return;
    }
    setApplying(true);
    const request = await apiFetch("/api/customer/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon, subtotal }),
    });
    const data = (await request.json()) as {
      discount?: number;
      offer?: { code: string };
      message?: string;
    };
    setApplying(false);
    if (!request.ok || !data.offer) {
      setDiscount(0);
      localStorage.removeItem("mydhobi_coupon");
      localStorage.removeItem("mydhobi_discount");
      toast.error(data.message ?? "Coupon is not valid");
      return;
    }
    setDiscount(data.discount ?? 0);
    setCoupon(data.offer.code);
    localStorage.setItem("mydhobi_coupon", data.offer.code);
    localStorage.setItem("mydhobi_discount", String(data.discount ?? 0));
    toast.success(`You saved ₹${data.discount ?? 0}`);
  }
  return (
    <div className="min-h-screen bg-[#fafafe] pb-28 text-[#17182c]">
      <CustomerSimpleHeader
        title="My Cart"
        backHref={
          cart?.serviceSlug
            ? `/customer/services/${cart.serviceSlug}`
            : "/customer/services"
        }
      />
      <main className="mx-auto max-w-[720px] space-y-3 px-4 py-4">
        {loaded && !cart ? (
          <p className="rounded-[12px] border border-dashed border-[#d8d4e2] bg-white px-4 py-12 text-center text-[11px] text-[#77798a]">
            Your cart is empty
          </p>
        ) : null}
        {cart?.items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="flex items-center gap-3 rounded-[12px] border border-[#e5e2eb] bg-white px-3 py-3"
          >
            <Image
              src={item.image || "/wash_fold.png"}
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold">{item.name}</p>
              <p className="mt-1 text-[9px] text-[#77798a]">
                ₹{item.unitPrice} × {item.quantity}
              </p>
              {[
                item.alias,
                item.packingType,
                item.brand,
                item.fabric,
                item.defect && item.defect !== "None" ? item.defect : "",
              ].filter(Boolean).length ? (
                <p className="mt-1 truncate text-[9px] text-[#8a8898]">
                  {[
                    item.alias,
                    item.packingType,
                    item.brand,
                    item.fabric,
                    item.defect && item.defect !== "None" ? item.defect : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <MuiAction
                type="button"
                onClick={() => updateQuantity(index, item.quantity - 1)}
                aria-label={`Remove one ${item.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#f1eaff] text-[#7440dc]"
              >
                <Minus className="h-3.5 w-3.5" />
              </MuiAction>
              <b className="w-4 text-center text-[11px]">{item.quantity}</b>
              <MuiAction
                type="button"
                onClick={() => updateQuantity(index, item.quantity + 1)}
                aria-label={`Add one ${item.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#7440dc] text-white"
              >
                <Plus className="h-3.5 w-3.5" />
              </MuiAction>
              <MuiAction
                type="button"
                onClick={() => updateQuantity(index, 0)}
                aria-label={`Remove ${item.name}`}
                className="ml-1 text-[#df4651]"
              >
                <Trash2 className="h-4 w-4" />
              </MuiAction>
            </div>
          </div>
        ))}
        <Link
          href="/customer/services"
          className="flex h-10 items-center justify-center gap-1 rounded-[10px] border border-[#8a50ee] text-[10px] font-bold text-[#7440dc]"
        >
          <Plus className="h-3.5 w-3.5" /> Add More Garments
        </Link>
        <section className="rounded-[12px] border border-[#e5e2eb] bg-white p-3">
          <h2 className="text-[11px] font-bold">Apply Coupon</h2>
          <div className="mt-2 flex gap-2">
            <MuiInput
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="h-10 min-w-0 flex-1 rounded-[9px] border border-[#e1deea] px-3 text-[10px] outline-none focus:border-[#8a50ee]"
            />
            <MuiAction
              type="button"
              disabled={applying}
              onClick={applyCoupon}
              className="rounded-[9px] border border-[#8a50ee] px-4 text-[10px] font-bold text-[#7440dc] disabled:opacity-60"
            >
              {applying ? "Checking..." : "Apply"}
            </MuiAction>
          </div>
        </section>
        <section className="rounded-[12px] border border-[#e5e2eb] bg-white p-3">
          <h2 className="text-[11px] font-bold">Price Details</h2>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-2 text-[10px]">
            <dt className="text-[#77798a]">Item Total</dt>
            <dd>₹{subtotal}</dd>
            <dt className="text-[#77798a]">Pickup Charges</dt>
            <dd className="text-[#23a84f]">FREE</dd>
            {discount > 0 ? (
              <>
                <dt className="text-[#77798a]">Coupon Discount</dt>
                <dd className="text-[#23a84f]">-₹{discount}</dd>
              </>
            ) : null}
            <dt className="border-t pt-3 font-bold">Total Amount</dt>
            <dd className="border-t pt-3 font-bold">₹{subtotal - discount}</dd>
          </dl>
        </section>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8e5ed] bg-white">
        {cart ? (
          <Link
            href="/customer/addresses"
            className="mx-auto flex h-[56px] max-w-[720px] items-center justify-center rounded-[12px] bg-[#7040dc] text-[16px] font-semibold text-white"
          >
            Proceed to Checkout
          </Link>
        ) : (
          <Link
            href="/customer/services"
            className="mx-auto flex h-[56px] max-w-[720px] items-center justify-center rounded-[12px] bg-[#7040dc] text-[16px] font-semibold text-white"
          >
            Choose a Garment
          </Link>
        )}
      </div>
    </div>
  );
}

export function AddressesView({ addresses }: { addresses: PortalAddress[] }) {
  const { draft, update } = useOrderingDraft();
  const [addressList, setAddressList] = useState(addresses);
  const [selected, setSelected] = useState(
    addresses.find((item) => item.id === draft.addressId)?.id ??
      addresses.find((item) => item.isDefault)?.id ??
      addresses[0]?.id ??
      "",
  );
  const quickPickup = draft.kind === "quick";
  const nextStep = "/customer/schedule";
  function selectAddress(address: PortalAddress) {
    setSelected(address.id);
    update({ addressId: address.id });
    localStorage.setItem("mydhobi_checkout_address_id", address.id);
    localStorage.setItem(
      "mydhobi_checkout_address",
      [address.fullAddress, address.landmark, address.city, address.pincode]
        .filter(Boolean)
        .join(", "),
    );
  }
  async function removeAddress(id: string) {
    if (!confirm("Delete this address?")) return;
    const request = await apiFetch(`/api/customer/addresses/${id}`, {
      method: "DELETE",
    });
    if (!request.ok) {
      toast.error("Unable to delete address");
      return;
    }
    const next = addressList.filter((item) => item.id !== id);
    setAddressList(next);
    invalidateCustomerData("/api/customer/addresses", "/api/customer/home");
    if (selected === id) {
      setSelected(next[0]?.id ?? "");
      localStorage.removeItem("mydhobi_checkout_address_id");
      localStorage.removeItem("mydhobi_checkout_address");
    }
    toast.success("Address deleted");
  }
  return (
    <div className="min-h-screen bg-[#faf8ff] pb-40 text-[#211a35]">
      <CustomerSimpleHeader
        title={quickPickup ? "Pickup Address" : "My Addresses"}
        backHref={quickPickup ? "/customer/quick-pickup" : "/customer/cart"}
      />
      <main className="mx-auto w-full max-w-[552px] space-y-3 px-4 py-4">
        {!addressList.length && (
          <section className="rounded-2xl border border-dashed border-[#d8c9f5] bg-white px-5 py-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f2ecff] text-[#7040dc]">
              <MapPin className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-sm font-bold">No saved addresses</h2>
            <p className="mt-1 text-xs text-[#777086]">
              Add an address to continue.
            </p>
          </section>
        )}
        {addressList.map((address) => {
          const Icon = address.type === "Office" ? BriefcaseBusiness : Home;
          const isSelected = selected === address.id;
          return (
            <article
              key={address.id}
              className={cn(
                "flex items-stretch gap-2 rounded-2xl border-2 p-3 transition-colors",
                isSelected
                  ? "border-[#7040dc] bg-[#fbf9ff] shadow-[0_4px_14px_rgba(112,64,220,0.08)]"
                  : "border-[#e8e3ef] bg-white",
              )}
            >
              <MuiAction
                type="button"
                onClick={() => selectAddress(address)}
                aria-pressed={isSelected}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2ecff] text-[#7040dc]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold leading-5">
                    {address.name || address.type}
                    <span className="rounded-full bg-[#f2ecff] px-2 py-0.5 text-[10px] font-semibold text-[#7040dc]">
                      {address.type}
                    </span>
                    {address.isDefault && (
                      <b className="rounded-full bg-[#e6f6eb] px-2 py-0.5 text-[10px] font-semibold text-[#218447]">
                        Default
                      </b>
                    )}
                  </span>
                  <span className="mt-1.5 block break-words text-[12px] leading-[1.55] text-[#5d566b]">
                    {[address.fullAddress, address.landmark, address.city]
                      .filter(Boolean)
                      .join(", ")}
                    {address.pincode ? ` - ${address.pincode}` : ""}
                  </span>
                  <span className="mt-1 block text-[11px] leading-4 text-[#777086]">
                    {address.phone}
                  </span>
                </span>
                <span
                  className={cn(
                    "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    isSelected
                      ? "border-[#7040dc] bg-[#7040dc] text-white"
                      : "border-[#d7d1e1] bg-white text-transparent",
                  )}
                  aria-hidden="true"
                >
                  {isSelected && <Check className="h-4 w-4" />}
                </span>
              </MuiAction>
              <Link
                href={`/customer/addresses/${address.id}/edit`}
                aria-label={`Edit ${address.type} address`}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#7440dc] hover:bg-[#f4efff]"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <MuiAction
                type="button"
                onClick={() => void removeAddress(address.id)}
                aria-label={`Delete ${address.type} address`}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </MuiAction>
            </article>
          );
        })}
      </main>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8e3ef] bg-white px-3 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(48,32,77,0.06)]">
        <div className="mx-auto w-full max-w-[520px] space-y-2">
          <Link
            href="/customer/addresses/new"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#d9c9f5] bg-white text-[13px] font-semibold text-[#7040dc] hover:bg-[#f7f3ff]"
          >
            <Plus className="h-4 w-4" /> Add New Address
          </Link>
          {addressList.length > 0 && (
            <Link
              href={nextStep}
              onClick={() => {
                const address =
                  addressList.find((item) => item.id === selected) ??
                  addressList[0];
                selectAddress(address);
              }}
              className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[#7040dc] text-[14px] font-bold text-white hover:bg-[#6033c7]"
            >
              Continue
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function AddAddressView({ address }: { address?: PortalAddress }) {
  const [type, setType] = useState(address?.type ?? "Home");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  async function saveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const response = await apiFetch(
      address
        ? `/api/customer/addresses/${address.id}`
        : "/api/customer/addresses",
      {
        method: address ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          type,
          fullAddress: form.get("fullAddress"),
          landmark: form.get("landmark"),
          city: form.get("city"),
          pincode: form.get("pincode"),
          isDefault: form.get("isDefault") === "on",
        }),
      },
    );
    const data = (await response.json()) as { message?: string };
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
    <div className="min-h-screen bg-[#fafafe] pb-28 text-[#17182c]">
      <CustomerSimpleHeader
        title={address ? "Edit Address" : "Add New Address"}
        backHref="/customer/addresses"
      />
      <form
        className="mx-auto max-w-[720px] space-y-4 px-4 py-4"
        onSubmit={saveAddress}
      >
        <fieldset>
          <legend className="text-[10px] font-bold">Address Type</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {["Home", "Office", "Other"].map((item) => (
              <MuiAction
                key={item}
                type="button"
                onClick={() => setType(item)}
                className={cn(
                  "h-10 rounded-[10px] border text-[10px] font-bold",
                  type === item
                    ? "border-[#7440dc] bg-[#f4efff] text-[#7440dc]"
                    : "border-[#e1deea] bg-white",
                )}
              >
                {item}
              </MuiAction>
            ))}
          </div>
        </fieldset>
        {[
          ["Full Name", "Name for pickup", "name", address?.name ?? ""],
          ["Phone", "10-digit mobile number", "phone", address?.phone ?? ""],
          [
            "Full Address",
            "House / Flat / Building, Street...",
            "fullAddress",
            address?.fullAddress ?? "",
          ],
          [
            "Landmark (Optional)",
            "E.g. Near ITPL Main Gate",
            "landmark",
            address?.landmark ?? "",
          ],
          ["City", "Bengaluru", "city", address?.city ?? ""],
          ["Pincode", "560066", "pincode", address?.pincode ?? ""],
        ].map(([label, placeholder, name, value]) => (
          <label key={label} className="block text-[10px] font-bold">
            {label}
            <MuiInput
              name={name}
              defaultValue={value}
              required={!label.includes("Optional")}
              inputMode={
                name === "pincode" || name === "phone" ? "numeric" : undefined
              }
              pattern={
                name === "pincode"
                  ? "[0-9]{6}"
                  : name === "phone"
                    ? "[0-9]{10}"
                    : undefined
              }
              maxLength={
                name === "pincode" ? 6 : name === "phone" ? 10 : undefined
              }
              onInput={
                name === "pincode" || name === "phone"
                  ? (event) => {
                      event.currentTarget.value = event.currentTarget.value
                        .replace(/\D/g, "")
                        .slice(0, name === "pincode" ? 6 : 10);
                    }
                  : undefined
              }
              placeholder={placeholder}
              className="mt-2 h-11 w-full rounded-[10px] border border-[#e1deea] bg-white px-3 text-[11px] font-normal outline-none focus:border-[#8a50ee]"
            />
          </label>
        ))}
        <label className="flex items-center justify-between text-[10px] font-bold">
          Set as default address
          <MuiInput
            name="isDefault"
            type="checkbox"
            defaultChecked={address?.isDefault ?? false}
            className="h-5 w-5 accent-[#7440dc]"
          />
        </label>
        <MuiAction
          type="submit"
          disabled={saving}
          className="fixed inset-x-4 bottom-3 mx-auto h-12 max-w-[688px] rounded-[12px] bg-[#7440dc] text-[12px] font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : address ? "Update Address" : "Save Address"}
        </MuiAction>
      </form>
    </div>
  );
}

export function PaymentView({ walletBalance }: { walletBalance: number }) {
  const [method, setMethod] = useState("UPI");
  const [isPaying, setIsPaying] = useState(false);
  const [total, setTotal] = useState(0);
  const [cart, setCart] = useState<CustomerCart | null>(null);
  const orderRequestKey = useRef("");
  const router = useRouter();
  useEffect(() => {
    const current = readCustomerCart();
    setCart(current);
    const saved = Number(localStorage.getItem("mydhobi_discount") ?? 0);
    setTotal(
      Math.max(0, cartSubtotal(current) - (Number.isFinite(saved) ? saved : 0)),
    );
  }, []);
  const methods = [
    {
      label: "UPI",
      detail: "Payment will be confirmed by staff",
      icon: CreditCard,
    },
    {
      label: "Wallet",
      detail: `Available balance: ₹${walletBalance.toFixed(2)}`,
      icon: WalletCards,
    },
    {
      label: "Debit / Credit Card",
      detail: "Payment will be confirmed by staff",
      icon: CreditCard,
    },
    {
      label: "Cash on Delivery",
      detail: "Pay when we deliver",
      icon: WalletCards,
    },
  ];
  async function placeOrder() {
    if (!cart) {
      toast.error("Your cart is empty");
      startNavigationProgress();
      router.push("/customer/services");
      return;
    }
    if (cart.items.some((item) => !item.garmentId || !item.serviceId)) {
      toast.error("Please choose your garments again.");
      writeCustomerCart(null);
      startNavigationProgress();
      router.push("/customer/services");
      return;
    }
    const checkoutAddress = localStorage.getItem("mydhobi_checkout_address");
    const checkoutAddressId = localStorage.getItem(
      "mydhobi_checkout_address_id",
    );
    if (!checkoutAddress || !checkoutAddressId) {
      toast.error("Select a pickup address");
      startNavigationProgress();
      router.push("/customer/addresses");
      return;
    }
    setIsPaying(true);
    const savedPickup = localStorage.getItem("mydhobi_pickup_at");
    const pickup = savedPickup ? new Date(savedPickup) : new Date();
    if (
      !savedPickup ||
      Number.isNaN(pickup.getTime()) ||
      pickup.getTime() < Date.now() + 30 * 60 * 1000 ||
      pickup.getTime() > Date.now() + 30 * 24 * 60 * 60 * 1000
    ) {
      pickup.setTime(Date.now());
      pickup.setDate(pickup.getDate() + 1);
      pickup.setHours(10, 0, 0, 0);
    }
    if (!orderRequestKey.current) orderRequestKey.current = crypto.randomUUID();
    try {
      const response = await apiFetch("/api/customer/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": orderRequestKey.current,
        },
        body: JSON.stringify({
          service: cart.service,
          pickupAt: pickup.toISOString(),
          paymentMethod:
            method === "Wallet"
              ? "wallet"
              : method === "Cash on Delivery"
                ? "cash"
                : method === "Debit / Credit Card"
                  ? "card"
                  : "upi",
          addressId: checkoutAddressId,
          instructions:
            localStorage.getItem("mydhobi_pickup_instructions") ?? "",
          couponCode: localStorage.getItem("mydhobi_coupon") ?? "",
          items: cart.items.map((item) => ({
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
      const data = (await response.json()) as {
        order?: { id: string };
        message?: string;
      };
      if (!response.ok || !data.order) {
        toast.error(data.message ?? "Unable to place order");
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
      router.push(
        `/customer/order-success?order=${encodeURIComponent(data.order.id)}`,
      );
    } catch {
      toast.error(
        "Unable to place order. Check your connection and try again.",
      );
    } finally {
      setIsPaying(false);
    }
  }
  return (
    <div className="min-h-screen bg-[#faf8ff] pb-36 text-[#211a35]">
      <CustomerSimpleHeader
        title="Payment Method"
        backHref="/customer/addresses"
      />
      <main className="mx-auto w-full max-w-[520px] space-y-5 px-4 py-4">
        <section className="overflow-hidden rounded-[16px] bg-[linear-gradient(120deg,#6033c7,#8b4def)] px-4 py-4 text-white shadow-[0_8px_20px_rgba(96,51,199,0.18)]">
          <p className="text-[10px] font-medium text-white/80">Amount to pay</p>
          <p className="mt-1 text-[27px] font-bold leading-tight">
            ₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-[10px] text-white/80">
            {cart
              ? `${cart.items.reduce((count, item) => count + item.quantity, 0)} items in your order`
              : "Your cart is empty"}
          </p>
        </section>

        <section aria-labelledby="payment-method-heading">
          <h2
            id="payment-method-heading"
            className="mb-2.5 text-[13px] font-bold"
          >
            Choose payment method
          </h2>
          <div className="space-y-2">
            {methods.map((item) => {
              const Icon = item.icon;
              return (
                <MuiAction
                  key={item.label}
                  type="button"
                  aria-pressed={method === item.label}
                  onClick={() => setMethod(item.label)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[12px] border px-3 py-3 text-left transition",
                    method === item.label
                      ? "border-[#8050df] bg-[#f5f0ff] shadow-[0_3px_10px_rgba(96,51,199,0.08)]"
                      : "border-[#e8e2f0] bg-white hover:border-[#cbb9eb]",
                  )}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#f0eaff] text-[#7440dc]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-[9px] text-[#77798a]">
                      {item.detail}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      method === item.label
                        ? "border-[#7440dc] bg-[#7440dc] text-white"
                        : "border-[#c8c3d0] bg-white",
                    )}
                  >
                    {method === item.label && <Check className="h-3 w-3" />}
                  </span>
                </MuiAction>
              );
            })}
          </div>
        </section>
      </main>
      <div className="fixed inset-x-0 bottom-0 border-t border-[#e9e3f2] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(48,32,77,.06)] backdrop-blur">
        <MuiAction
          type="button"
          disabled={isPaying || !cart}
          onClick={placeOrder}
          className="mx-auto my-3 flex h-[52px] w-[calc(100%-32px)] max-w-[488px] items-center justify-center rounded-[12px] bg-[linear-gradient(100deg,#7040dc,#8b4def)] text-[14px] font-bold text-white shadow-[0_6px_14px_rgba(112,64,220,.18)] disabled:opacity-60"
        >
          {isPaying
            ? "Placing Order..."
            : cart
              ? method === "Wallet"
                ? `Pay ₹${total}`
                : `Place Order · ₹${total}`
              : "Cart is Empty"}
        </MuiAction>
      </div>
    </div>
  );
}

export function OrderSuccessView({ order }: { order: PortalOrder }) {
  return (
    <div className="min-h-screen bg-white text-[#191d13]">
      <main className="mx-auto flex min-h-screen max-w-[520px] flex-col px-8 py-12 text-center">
        <div className="flex flex-1 flex-col items-center justify-center">
          <span
            className="order-success-mark"
            role="img"
            aria-label="Order placed successfully"
          >
            <span className="order-success-confetti" aria-hidden="true">
              {Array.from({ length: 12 }, (_, index) => (
                <span key={index} />
              ))}
            </span>
            <span className="order-success-mark__circle">
              <CheckCircle2 className="h-12 w-12" />
            </span>
          </span>
          <h1 className="mt-10 text-[25px] font-black uppercase tracking-[-0.04em]">
            Please keep your
            <br />
            items ready!
          </h1>
          <p className="mt-10 text-[15px] leading-6 text-[#343a29]">
            Our MyDhobi expert will be on the way soon.
          </p>
          <div className="mt-14 text-[19px] font-extrabold leading-10">
            <p>
              {new Intl.DateTimeFormat("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              }).format(new Date(order.pickupAt))}
            </p>
            <p>
              {order.pickupSlot ||
                new Intl.DateTimeFormat("en-IN", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                  timeZone: "Asia/Kolkata",
                }).format(new Date(order.pickupAt))}
            </p>
          </div>
          <p className="mt-4 text-[10px] text-[#6f7663]">
            Pickup #{order.id} · {order.address}
          </p>
        </div>
        <div className="w-full space-y-3 pt-8">
          <Link
            href={`/customer/orders/${order.id}`}
            className="flex h-14 items-center justify-center rounded-lg bg-[#7040dc] text-[15px] font-bold text-white"
          >
            View pickup details
          </Link>
          <Link
            href="/customer"
            className="flex h-14 items-center justify-center rounded-lg bg-[#7040dc] text-[15px] font-bold text-white"
          >
            Go Back To Home
          </Link>
        </div>
      </main>
    </div>
  );
}
