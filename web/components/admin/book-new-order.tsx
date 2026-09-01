"use client";

import {
  Check,
  LoaderCircle,
  Minus,
  PackageOpen,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Shirt,
  ShoppingCart,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { startNavigationProgress } from "@/components/navigation-loader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DEFECT_TYPES,
  FABRIC_TYPES,
  PACKING_TYPES,
} from "@/lib/customer-cart";
import type { Customer } from "@/lib/customers";
import type {
  ItemCategory,
  PricingUnit,
  RateCardGroup,
} from "@/lib/item-master-types";
import type { TariffItem, TariffSheet } from "@/lib/tariffs";
import { cn } from "@/lib/utils";

type BookingType = "general" | "package";

type BookingData = {
  categories: ItemCategory[];
  tariffs: RateCardGroup[];
  customers: Customer[];
  tariffId: number | null;
  categoryId: number | null;
  sheet: TariffSheet | null;
};

type PricedService = {
  serviceId: number;
  serviceName: string;
  price: number;
  pricingUnit: PricingUnit;
};

type AddedItem = {
  id: string;
  tariffId: number;
  categoryId: number;
  itemId: number;
  itemName: string;
  serviceId: number;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  pricingUnit: PricingUnit;
  packingType: string;
  brand: string;
  fabric: string;
  defect: string;
  color: string;
  remark: string;
};

const selectClassName =
  "h-9 w-full rounded border border-[#DCE6F2] bg-white px-3 text-[12px] text-[#071333] outline-none transition-colors focus:border-[#075DFF] focus:ring-1 focus:ring-[#075DFF]/20 disabled:cursor-not-allowed disabled:opacity-50";
const labelClassName = "block text-[11px] font-medium text-[#385071]";

function localDateTimeValue(minutesFromNow: number) {
  const value = new Date(Date.now() + minutesFromNow * 60 * 1000);
  value.setSeconds(0, 0);
  return new Date(value.getTime() - value.getTimezoneOffset() * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}

function money(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  });
}

function unitLabel(unit: PricingUnit) {
  if (unit === "kg") return "kg";
  if (unit === "pair") return "pair";
  if (unit === "set") return "set";
  if (unit === "sq_ft") return "sq. ft.";
  return "piece";
}

function pricedServices(
  item: TariffItem,
  sheet: TariffSheet,
  bookingType: BookingType,
) {
  const requiredUnit = bookingType === "general" ? "piece" : "kg";
  return sheet.services.flatMap((service): PricedService[] => {
    const rate = item.rates[String(service.id)];
    if (
      !rate?.isAvailable ||
      rate.price === null ||
      rate.pricingUnit !== requiredUnit
    ) {
      return [];
    }
    return [{
      serviceId: service.id,
      serviceName: service.name,
      price: rate.price,
      pricingUnit: rate.pricingUnit,
    }];
  });
}

async function requestBookingData(tariffId?: string, categoryId?: string) {
  const params = new URLSearchParams();
  if (tariffId) params.set("tariffId", tariffId);
  if (categoryId) params.set("categoryId", categoryId);
  const response = await fetch(
    `/api/admin/orders/booking-data${params.size ? `?${params}` : ""}`,
    { cache: "no-store", credentials: "same-origin" },
  );
  const body = await response.json().catch(() => null) as
    | (BookingData & { message?: string })
    | null;
  if (!response.ok || !body) {
    throw new Error(body?.message ?? "Unable to load booking items.");
  }
  return body;
}

export function BookNewOrder() {
  const router = useRouter();
  const [bookingType, setBookingType] = useState<BookingType>("general");
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [tariffs, setTariffs] = useState<RateCardGroup[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tariffId, setTariffId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sheet, setSheet] = useState<TariffSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [packingType, setPackingType] = useState("");
  const [brand, setBrand] = useState("");
  const [fabric, setFabric] = useState("");
  const [defect, setDefect] = useState<(typeof DEFECT_TYPES)[number]>("None");
  const [color, setColor] = useState("");
  const [remark, setRemark] = useState("");
  const [addedItems, setAddedItems] = useState<AddedItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [pickupAt, setPickupAt] = useState("");
  const [minimumPickupAt, setMinimumPickupAt] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [instructions, setInstructions] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [customerSaving, setCustomerSaving] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerHouse, setCustomerHouse] = useState("");
  const [customerStreet, setCustomerStreet] = useState("");
  const [customerLandmark, setCustomerLandmark] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerPincode, setCustomerPincode] = useState("");
  const requestNumber = useRef(0);

  const loadData = useCallback(async (nextTariffId?: string, nextCategoryId?: string) => {
    const requestId = requestNumber.current + 1;
    requestNumber.current = requestId;
    setLoading(true);
    setError(null);
    try {
      const data = await requestBookingData(nextTariffId, nextCategoryId);
      if (requestNumber.current !== requestId) return;
      setCategories(data.categories);
      setTariffs(data.tariffs);
      setCustomers(data.customers);
      setTariffId(data.tariffId === null ? "" : String(data.tariffId));
      setCategoryId(data.categoryId === null ? "" : String(data.categoryId));
      setSheet(data.sheet);
    } catch (reason) {
      if (requestNumber.current !== requestId) return;
      setSheet(null);
      setError(reason instanceof Error ? reason.message : "Unable to load booking items.");
    } finally {
      if (requestNumber.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setPickupAt((current) => current || localDateTimeValue(60));
    setMinimumPickupAt(localDateTimeValue(16));
  }, []);

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (sheet?.items ?? []).filter((item) => {
      const hasPrice = sheet
        ? pricedServices(item, sheet, bookingType).length > 0
        : false;
      return hasPrice && (!normalized || item.name.toLowerCase().includes(normalized));
    });
  }, [bookingType, query, sheet]);

  const selectedItem = visibleItems.find((item) => item.id === selectedItemId) ?? null;
  const selectedServices = selectedItem && sheet
    ? pricedServices(selectedItem, sheet, bookingType)
    : [];
  const selectedService = selectedServices.find(
    (service) => String(service.serviceId) === serviceId,
  ) ?? selectedServices[0] ?? null;
  const numericQuantity = Number(quantity);
  const lineAmount = selectedService && Number.isFinite(numericQuantity)
    ? selectedService.price * numericQuantity
    : 0;
  const orderTotal = addedItems.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );

  function resetItemForm() {
    setQuantity("1");
    setPackingType("");
    setBrand("");
    setFabric("");
    setDefect("None");
    setColor("");
    setRemark("");
  }

  function clearSelectedItem() {
    setSelectedItemId(null);
    setServiceId("");
    resetItemForm();
  }

  function confirmPriceChange() {
    if (!addedItems.length) return true;
    return window.confirm("Changing this will clear the added items. Continue?");
  }

  function changeBookingType(next: BookingType) {
    if (next === bookingType || !confirmPriceChange()) return;
    setBookingType(next);
    setAddedItems([]);
    clearSelectedItem();
  }

  function changeTariff(nextTariffId: string) {
    if (nextTariffId === tariffId || !confirmPriceChange()) return;
    setAddedItems([]);
    clearSelectedItem();
    setTariffId(nextTariffId);
    void loadData(nextTariffId, categoryId);
  }

  function changeCategory(nextCategoryId: string) {
    if (nextCategoryId === categoryId) return;
    clearSelectedItem();
    setQuery("");
    setCategoryId(nextCategoryId);
    void loadData(tariffId, nextCategoryId);
  }

  function chooseItem(item: TariffItem) {
    if (!sheet) return;
    const firstService = pricedServices(item, sheet, bookingType)[0];
    setSelectedItemId(item.id);
    setServiceId(firstService ? String(firstService.serviceId) : "");
    resetItemForm();
  }

  function addItem(closeAfterAdd: boolean) {
    if (!selectedItem || !selectedService || !tariffId || !categoryId) return;
    const validQuantity = bookingType === "general"
      ? Number.isInteger(numericQuantity) && numericQuantity >= 1 && numericQuantity <= 100
      : Number.isFinite(numericQuantity) && numericQuantity > 0 && numericQuantity <= 1000;
    if (!validQuantity) {
      toast.error(
        bookingType === "general"
          ? "Enter a quantity from 1 to 100."
          : "Enter a weight from 0.01 to 1000 kg.",
      );
      return;
    }

    setAddedItems((current) => [...current, {
      id: crypto.randomUUID(),
      tariffId: Number(tariffId),
      categoryId: Number(categoryId),
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      serviceId: selectedService.serviceId,
      serviceName: selectedService.serviceName,
      quantity: numericQuantity,
      unitPrice: selectedService.price,
      pricingUnit: selectedService.pricingUnit,
      packingType,
      brand: brand.trim(),
      fabric,
      defect,
      color: color.trim(),
      remark: remark.trim(),
    }]);
    toast.success(`${selectedItem.name} added`);
    if (closeAfterAdd) {
      clearSelectedItem();
    } else {
      resetItemForm();
    }
  }

  function resetCustomerForm() {
    setCustomerName("");
    setCustomerMobile("");
    setCustomerHouse("");
    setCustomerStreet("");
    setCustomerLandmark("");
    setCustomerCity("");
    setCustomerPincode("");
    setCustomerError("");
  }

  async function addCustomer() {
    if (customerSaving) return;
    if (!customerName.trim()) {
      setCustomerError("Full name is required.");
      return;
    }
    if (!/^\d{10}$/.test(customerMobile)) {
      setCustomerError("Enter a 10-digit mobile number.");
      return;
    }
    if (!customerHouse.trim() || !customerStreet.trim() || !customerCity.trim()) {
      setCustomerError("Enter the customer address.");
      return;
    }
    if (!/^\d{6}$/.test(customerPincode)) {
      setCustomerError("Enter a 6-digit pincode.");
      return;
    }

    setCustomerSaving(true);
    setCustomerError("");
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: customerName,
          mobile: customerMobile,
          whatsapp: "",
          customerType: "individual",
          houseFlatNo: customerHouse,
          streetArea: customerStreet,
          landmark: customerLandmark,
          city: customerCity,
          pincode: customerPincode,
          googleMapsPin: "",
          pickupFrequency: "",
          assignedRider: "",
          assignedRoute: "",
          rateCard: tariffs.find((tariff) => String(tariff.id) === tariffId)?.name ?? "",
          paymentMethod: "cash",
          creditCustomer: false,
          creditLimit: null,
          pickupInstructions: "",
          internalNotes: "",
          status: "active",
        }),
      });
      const data = await response.json().catch(() => null) as
        | { customer?: Customer; message?: string }
        | null;
      if (!response.ok || !data?.customer) {
        setCustomerError(data?.message ?? "Unable to add customer.");
        return;
      }
      setCustomers((current) => [
        data.customer!,
        ...current.filter((customer) => customer.id !== data.customer!.id),
      ]);
      setCustomerId(data.customer.id);
      setCustomerDialogOpen(false);
      resetCustomerForm();
      toast.success("Customer added");
    } catch {
      setCustomerError("Unable to add customer right now.");
    } finally {
      setCustomerSaving(false);
    }
  }

  async function placeOrder() {
    if (placingOrder) return;
    if (!addedItems.length) {
      toast.error("Add at least one item.");
      return;
    }
    if (!customerId) {
      toast.error("Choose a customer.");
      return;
    }
    if (!pickupAt) {
      toast.error("Choose a pickup time.");
      return;
    }

    setPlacingOrder(true);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          tariffId: Number(tariffId),
          bookingType,
          pickupAt: new Date(pickupAt).toISOString(),
          paymentMethod,
          instructions,
          idempotencyKey: crypto.randomUUID(),
          items: addedItems.map((item) => ({
            garmentId: item.itemId,
            serviceId: item.serviceId,
            quantity: item.quantity,
            packingType: item.packingType,
            brand: item.brand,
            fabric: item.fabric,
            defect: item.defect,
            color: item.color,
            remark: item.remark,
          })),
        }),
      });
      const data = await response.json().catch(() => null) as
        | { order?: { id: string }; message?: string }
        | null;
      if (!response.ok || !data?.order) {
        toast.error(data?.message ?? "Unable to place order.");
        return;
      }
      toast.success(`Order ${data.order.id} placed`);
      startNavigationProgress();
      router.push(`/admin/orders/${data.order.id}`);
    } catch {
      toast.error("Unable to place order. Check your connection and try again.");
    } finally {
      setPlacingOrder(false);
    }
  }

  const categoryName = categories.find((category) => String(category.id) === categoryId)?.name;

  return (
    <div className="space-y-3">
      <section className="rounded border border-[#DCE6F2] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.045)]">
        <div className="grid gap-4 md:grid-cols-[minmax(300px,1fr)_minmax(220px,360px)] md:items-end">
          <div>
            <span className={labelClassName}>Booking type</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => changeBookingType("general")}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 rounded border px-3 py-2 text-[12px] font-medium transition-colors",
                  bookingType === "general"
                    ? "border-[#075DFF] bg-[#EEF5FF] text-[#075DFF]"
                    : "border-[#DCE6F2] bg-white text-[#385071] hover:bg-[#F7FAFF]",
                )}
              >
                <Shirt className="h-4 w-4" />
                <span className="text-left">
                  <span className="block">General booking</span>
                  <span className="mt-0.5 block text-[10px] font-normal">Per piece</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => changeBookingType("package")}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 rounded border px-3 py-2 text-[12px] font-medium transition-colors",
                  bookingType === "package"
                    ? "border-[#075DFF] bg-[#EEF5FF] text-[#075DFF]"
                    : "border-[#DCE6F2] bg-white text-[#385071] hover:bg-[#F7FAFF]",
                )}
              >
                <Scale className="h-4 w-4" />
                <span className="text-left">
                  <span className="block">Package booking</span>
                  <span className="mt-0.5 block text-[10px] font-normal">Per kg</span>
                </span>
              </button>
            </div>
          </div>
          <label className={labelClassName}>
            Tariff
            <select
              value={tariffId}
              disabled={loading || tariffs.length === 0}
              onChange={(event) => changeTariff(event.target.value)}
              className={`${selectClassName} mt-1.5`}
            >
              {tariffs.length === 0 ? <option value="">No tariff available</option> : null}
              {tariffs.map((tariff) => (
                <option key={tariff.id} value={tariff.id}>
                  {tariff.name}{tariff.tariffCode ? ` (${tariff.tariffCode})` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded border border-[#DCE6F2] bg-white p-2 shadow-[0_6px_18px_rgba(15,23,42,0.045)]">
          <h2 className="px-2 py-2 text-[13px] font-semibold text-[#071333]">Category</h2>
          <div className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
            {categories.map((category) => {
              const active = String(category.id) === categoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  disabled={loading}
                  onClick={() => changeCategory(String(category.id))}
                  className={cn(
                    "flex h-10 shrink-0 items-center gap-2 rounded px-3 text-left text-[12px] transition-colors lg:w-full",
                    active
                      ? "bg-[#EEF5FF] font-medium text-[#075DFF]"
                      : "text-[#385071] hover:bg-[#F7FAFF]",
                  )}
                >
                  <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full",
                    active ? "bg-[#075DFF] text-white" : "bg-[#EEF3F8] text-[#71809A]",
                  )}>
                    {active ? <Check className="h-3.5 w-3.5" /> : category.name.slice(0, 1).toUpperCase()}
                  </span>
                  {category.name}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded border border-[#DCE6F2] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.045)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7EDF5] px-4 py-3">
            <h2 className="text-[13px] font-semibold text-[#071333]">Items</h2>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#71809A]">
                {visibleItems.length} {bookingType === "general" ? "piece" : "kg"} items
              </span>
              <label className="relative block w-[190px] max-w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71809A]" />
                <span className="sr-only">Search items</span>
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search item"
                  className="h-8 pl-8 text-[11px] shadow-none"
                />
              </label>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center gap-2 text-[12px] text-[#52627A]">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading items...
            </div>
          ) : error ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-4 text-center">
              <p className="text-[12px] text-red-700">{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadData(tariffId, categoryId)}>
                <RefreshCw /> Retry
              </Button>
            </div>
          ) : !tariffs.length ? (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-[12px] text-[#52627A]">
              No active tariff is available.
            </div>
          ) : !categories.length ? (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-[12px] text-[#52627A]">
              No active category is available.
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-4 text-center">
              <PackageOpen className="h-8 w-8 text-[#A7B4C7]" />
              <p className="mt-3 text-[12px] font-medium text-[#071333]">No priced items found</p>
              <p className="mt-1 text-[11px] text-[#71809A]">
                Check the {bookingType === "general" ? "piece" : "kg"} prices in this tariff.
              </p>
            </div>
          ) : (
            <Table className="min-w-[620px]">
              <TableHeader>
                <TableRow className="bg-[#F8FAFD] hover:bg-[#F8FAFD]">
                  <TableHead>Item</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="w-[92px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleItems.map((item) => {
                  const services = sheet ? pricedServices(item, sheet, bookingType) : [];
                  const active = item.id === selectedItemId;
                  return (
                    <TableRow key={item.id} className={active ? "bg-[#EEF5FF] hover:bg-[#EEF5FF]" : undefined}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded text-[12px] font-semibold",
                            active ? "bg-[#075DFF] text-white" : "bg-[#EEF5FF] text-[#075DFF]",
                          )}>
                            {active ? <Check className="h-4 w-4" /> : item.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="font-medium text-[#071333]">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {services.map((service) => (
                            <p key={service.serviceId} className="text-[11px] text-[#385071]">{service.serviceName}</p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          {services.map((service) => (
                            <p key={service.serviceId} className="text-[11px] font-semibold text-[#071333]">₹{money(service.price)}</p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] text-[#52627A]">
                        {unitLabel(services[0]?.pricingUnit ?? (bookingType === "general" ? "piece" : "kg"))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant={active ? "default" : "outline"}
                          onClick={() => chooseItem(item)}
                          className="min-w-[70px]"
                        >
                          {active ? "Selected" : "Select"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <Dialog
            open={Boolean(selectedItem && selectedService)}
            onOpenChange={(open) => {
              if (!open) clearSelectedItem();
            }}
          >
          {selectedItem && selectedService ? (
            <DialogContent className="top-1/2 max-h-[90vh] max-w-[760px] overflow-hidden">
              <DialogHeader>
                <DialogTitle>{selectedItem.name}</DialogTitle>
              </DialogHeader>
              <div className="max-h-[calc(90vh-61px)] overflow-y-auto bg-[#FAFCFF] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium text-[#52627A]">Category</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#071333]">{categoryName}</p>
                </div>
                <div className="rounded border border-[#CFE0FA] bg-white px-3 py-2 text-right">
                  <p className="text-[10px] text-[#52627A]">Price</p>
                  <p className="mt-1 text-[15px] font-semibold text-[#075DFF]">
                    ₹{money(selectedService.price)} / {unitLabel(selectedService.pricingUnit)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <span className={labelClassName}>Service</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {selectedServices.map((service) => (
                    <button
                      key={service.serviceId}
                      type="button"
                      onClick={() => setServiceId(String(service.serviceId))}
                      className={cn(
                        "rounded border px-3 py-2 text-[11px] transition-colors",
                        service.serviceId === selectedService.serviceId
                          ? "border-[#075DFF] bg-[#EEF5FF] font-medium text-[#075DFF]"
                          : "border-[#DCE6F2] bg-white text-[#385071] hover:bg-[#F7FAFF]",
                      )}
                    >
                      {service.serviceName} · ₹{money(service.price)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <label className={labelClassName}>
                  {bookingType === "general" ? "Quantity" : "Weight (kg)"}
                  {bookingType === "general" ? (
                    <span className="mt-1.5 flex h-9 overflow-hidden rounded border border-[#DCE6F2] bg-white">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(String(Math.max(1, Math.floor(numericQuantity || 1) - 1)))}
                        className="flex w-9 items-center justify-center text-[#385071] hover:bg-[#EEF5FF] hover:text-[#075DFF]"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        value={quantity}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={100}
                        onChange={(event) => setQuantity(event.target.value)}
                        className="min-w-0 flex-1 border-x border-[#DCE6F2] bg-white px-2 text-center text-[12px] outline-none"
                      />
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(String(Math.min(100, Math.floor(numericQuantity || 0) + 1)))}
                        className="flex w-9 items-center justify-center text-[#385071] hover:bg-[#EEF5FF] hover:text-[#075DFF]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : (
                    <Input
                      value={quantity}
                      type="number"
                      inputMode="decimal"
                      min={0.01}
                      max={1000}
                      step={0.01}
                      onChange={(event) => setQuantity(event.target.value)}
                      className="mt-1.5 shadow-none"
                    />
                  )}
                </label>
                <label className={labelClassName}>
                  Packaging type
                  <select value={packingType} onChange={(event) => setPackingType(event.target.value)} className={`${selectClassName} mt-1.5`}>
                    <option value="">Select packaging</option>
                    {PACKING_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <label className={labelClassName}>
                  Brand
                  <Input value={brand} maxLength={80} onChange={(event) => setBrand(event.target.value)} placeholder="Optional" className="mt-1.5 shadow-none" />
                </label>
                <label className={labelClassName}>
                  Fabric
                  <select value={fabric} onChange={(event) => setFabric(event.target.value)} className={`${selectClassName} mt-1.5`}>
                    <option value="">Select fabric</option>
                    {FABRIC_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <label className={labelClassName}>
                  Defect
                  <select value={defect} onChange={(event) => setDefect(event.target.value as (typeof DEFECT_TYPES)[number])} className={`${selectClassName} mt-1.5`}>
                    {DEFECT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <label className={labelClassName}>
                  Color
                  <Input value={color} maxLength={40} onChange={(event) => setColor(event.target.value)} placeholder="Optional" className="mt-1.5 shadow-none" />
                </label>
                <label className={`${labelClassName} sm:col-span-2`}>
                  Remark
                  <Input value={remark} maxLength={160} onChange={(event) => setRemark(event.target.value)} placeholder="Optional" className="mt-1.5 shadow-none" />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E1E9F2] pt-4">
                <p className="text-[12px] text-[#52627A]">
                  Amount <span className="ml-1 text-[16px] font-semibold text-[#071333]">₹{money(lineAmount)}</span>
                </p>
                <div className="flex flex-1 justify-end gap-2 sm:flex-none">
                  <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => addItem(false)}>
                    <Plus /> Add and continue
                  </Button>
                  <Button type="button" className="flex-1 sm:flex-none" onClick={() => addItem(true)}>
                    <Check /> Add &amp; close
                  </Button>
                </div>
              </div>
              </div>
            </DialogContent>
          ) : null}
          </Dialog>
        </section>
      </div>

      <section className="overflow-hidden rounded border border-[#DCE6F2] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.045)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#E7EDF5] px-4 py-3">
          <h2 className="text-[13px] font-semibold text-[#071333]">Added items</h2>
          <span className="rounded bg-[#EEF5FF] px-2 py-1 text-[11px] font-medium text-[#075DFF]">
            {addedItems.length} item{addedItems.length === 1 ? "" : "s"}
          </span>
        </div>
        {addedItems.length ? (
          <div>
            {addedItems.map((item) => {
              const details = [item.packingType, item.brand, item.fabric, item.defect !== "None" ? item.defect : "", item.color, item.remark].filter(Boolean);
              return (
                <div key={item.id} className="grid gap-2 border-b border-[#EDF1F6] px-4 py-3 last:border-0 sm:grid-cols-[minmax(0,1fr)_120px_120px_36px] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-[#071333]">{item.itemName} · {item.serviceName}</p>
                    {details.length ? <p className="mt-1 truncate text-[10px] text-[#71809A]">{details.join(" · ")}</p> : null}
                  </div>
                  <p className="text-[11px] text-[#52627A] sm:text-right">
                    {item.quantity} {item.pricingUnit === "kg" ? "kg" : item.quantity === 1 ? "piece" : "pieces"} × ₹{money(item.unitPrice)}
                  </p>
                  <p className="text-[13px] font-semibold text-[#071333] sm:text-right">₹{money(item.quantity * item.unitPrice)}</p>
                  <button
                    type="button"
                    title="Remove item"
                    aria-label={`Remove ${item.itemName}`}
                    onClick={() => setAddedItems((current) => current.filter((entry) => entry.id !== item.id))}
                    className="flex h-8 w-8 items-center justify-center rounded text-[#71809A] hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            <div className="flex items-center justify-end gap-4 border-t border-[#DCE6F2] bg-[#FAFCFF] px-4 py-3">
              <span className="text-[12px] text-[#52627A]">Total</span>
              <span className="text-[18px] font-semibold text-[#071333]">₹{money(orderTotal)}</span>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[96px] items-center justify-center px-4 text-center text-[11px] text-[#71809A]">
            Select an item and add it to this order.
          </div>
        )}
        <div className="border-t border-[#DCE6F2] bg-[#FAFCFF] p-4">
          <h3 className="text-[13px] font-semibold text-[#071333]">Customer and pickup</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <span className={labelClassName}>Customer</span>
              <div className="mt-1.5 flex gap-2">
                <select
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  className={selectClassName}
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName} · {customer.mobile}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Add customer"
                  aria-label="Add customer"
                  onClick={() => setCustomerDialogOpen(true)}
                  className="shrink-0"
                >
                  <UserPlus />
                </Button>
              </div>
            </div>
            <label className={labelClassName}>
              Pickup time
              <Input
                type="datetime-local"
                value={pickupAt}
                min={minimumPickupAt}
                onChange={(event) => setPickupAt(event.target.value)}
                className="mt-1.5 shadow-none"
              />
            </label>
            <label className={labelClassName}>
              Payment method
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className={`${selectClassName} mt-1.5`}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </label>
            <label className={labelClassName}>
              Instructions
              <Input
                value={instructions}
                maxLength={120}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Optional"
                className="mt-1.5 shadow-none"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE6F2] pt-4">
            <p className="text-[12px] text-[#52627A]">
              Order total <span className="ml-1 text-[18px] font-semibold text-[#071333]">₹{money(orderTotal)}</span>
            </p>
            <Button
              type="button"
              disabled={placingOrder || !addedItems.length || !customerId || !pickupAt}
              onClick={() => void placeOrder()}
              className="min-w-[150px]"
            >
              {placingOrder ? <LoaderCircle className="animate-spin" /> : <ShoppingCart />}
              {placingOrder ? "Placing order..." : "Place order"}
            </Button>
          </div>
        </div>
      </section>

      <Dialog
        open={customerDialogOpen}
        onOpenChange={(open) => {
          if (customerSaving) return;
          setCustomerDialogOpen(open);
          if (!open) resetCustomerForm();
        }}
      >
        <DialogContent className="top-1/2 max-h-[90vh] max-w-[620px] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add customer</DialogTitle>
          </DialogHeader>
          <div className="max-h-[calc(90vh-61px)] overflow-y-auto p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`${labelClassName} sm:col-span-2`}>
                Full name
                <Input
                  value={customerName}
                  maxLength={150}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="mt-1.5 shadow-none"
                />
              </label>
              <label className={labelClassName}>
                Mobile number
                <Input
                  value={customerMobile}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(event) => setCustomerMobile(event.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="mt-1.5 shadow-none"
                />
              </label>
              <label className={labelClassName}>
                Pincode
                <Input
                  value={customerPincode}
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setCustomerPincode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mt-1.5 shadow-none"
                />
              </label>
              <label className={labelClassName}>
                House/Flat no.
                <Input value={customerHouse} maxLength={100} onChange={(event) => setCustomerHouse(event.target.value)} className="mt-1.5 shadow-none" />
              </label>
              <label className={labelClassName}>
                Street/Area
                <Input value={customerStreet} maxLength={200} onChange={(event) => setCustomerStreet(event.target.value)} className="mt-1.5 shadow-none" />
              </label>
              <label className={labelClassName}>
                Landmark
                <Input value={customerLandmark} maxLength={150} onChange={(event) => setCustomerLandmark(event.target.value)} placeholder="Optional" className="mt-1.5 shadow-none" />
              </label>
              <label className={labelClassName}>
                City
                <Input value={customerCity} maxLength={100} onChange={(event) => setCustomerCity(event.target.value)} className="mt-1.5 shadow-none" />
              </label>
            </div>
            {customerError ? (
              <p className="mt-3 rounded border border-red-100 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {customerError}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2 border-t border-[#E7EDF5] pt-4">
              <Button type="button" variant="outline" disabled={customerSaving} onClick={() => setCustomerDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={customerSaving} onClick={() => void addCustomer()}>
                {customerSaving ? <LoaderCircle className="animate-spin" /> : <UserPlus />}
                {customerSaving ? "Adding..." : "Add customer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
