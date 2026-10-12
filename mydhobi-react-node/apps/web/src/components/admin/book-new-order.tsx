import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Chip,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import { BookingItemPicker, BookingTypeOptions } from "./booking-item-picker";
import { queryClient } from "@/platform/query-client";
import type { AdminBookingInput } from "@/lib/admin-order-booking";
import {
  MuiAction,
  MuiInput,
  MuiSelect,
} from "@/components/ui/native-controls";
import { apiFetch } from "@/platform/http";
import Image from "@/platform/image";
import { useRouter } from "@/platform/navigation";
import { toast } from "@/platform/notifications";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  FileText,
  LoaderCircle,
  Minus,
  PackageCheck,
  Percent,
  Plus,
  ReceiptText,
  ShoppingCart,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { startNavigationProgress } from "@/components/navigation-loader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DEFECT_TYPES, FABRIC_TYPES, PACKING_TYPES } from "@/lib/customer-cart";
import type { Customer } from "@/lib/customers";
import {
  calculateDiscountedPrice,
  type DiscountGroupPricing,
} from "@/lib/discount-groups";
import type { OrderCharge } from "@/lib/order-charges";
import type {
  ItemCategory,
  PricingUnit,
  RateCardGroup,
} from "@/lib/item-master-types";
import type { TariffItem, TariffSheet } from "@/lib/tariffs";
import { cn } from "@/lib/utils";

type BookingType = AdminBookingInput["bookingType"];
type BookingStep = 0 | 1 | 2;

type BookingData = {
  categories: ItemCategory[];
  tariffs: RateCardGroup[];
  customers: Customer[];
  tariffId: number | null;
  categoryId: number | null;
  sheet: TariffSheet | null;
  charges: OrderCharge[];
  discountGroups: DiscountGroupPricing[];
};

type PricedService = {
  serviceId: number;
  serviceName: string;
  basePrice: number;
  price: number;
  pricingUnit: PricingUnit;
  discountType: string | null;
  discountValue: number;
  discountAmount: number;
};

type AddedItem = {
  id: string;
  tariffId: number;
  categoryId: number;
  itemId: number;
  imagePath: string;
  itemName: string;
  serviceId: number;
  serviceName: string;
  quantity: number;
  baseUnitPrice: number;
  unitPrice: number;
  discountType: string | null;
  discountValue: number;
  discountAmount: number;
  pricingUnit: PricingUnit;
  packingType: string;
  brand: string;
  fabric: string;
  defect: string;
  color: string;
  remark: string;
};

function stepFromUrl(): BookingStep {
  if (typeof window === "undefined") return 0;
  const value = Number(new URLSearchParams(window.location.search).get("step"));
  return value === 1 || value === 2 ? value : 0;
}

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

function AddedItemsSummary({
  items,
  onRemove,
}: {
  items: AddedItem[];
  onRemove: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <section
      aria-label="Added items"
      className="border-y border-[#E7EDF5] bg-[#FAFCFF] px-4 py-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[12px] font-semibold text-[#071333]">
          Added items
        </h3>
        <span className="text-[11px] text-[#71809A]">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex max-h-56 flex-wrap items-start gap-x-4 gap-y-3 overflow-y-auto pb-1">
        {items.map((item) => (
          <div key={item.id} className="w-[76px] text-center">
            <div className="relative mx-auto h-14 w-14">
              {item.imagePath ? (
                <Image
                  src={item.imagePath}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full border-2 border-[#DCE6F2] bg-[#EEF5FF] object-contain p-1"
                />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#DCE6F2] bg-[#EEF5FF] text-[16px] font-semibold text-[#075DFF]">
                  {item.itemName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <IconButton
                size="small"
                aria-label={`Remove ${item.itemName}`}
                onClick={() => onRemove(item.id)}
                title={`Remove ${item.itemName}`}
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  width: 22,
                  height: 22,
                  bgcolor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                  color: "text.secondary",
                  boxShadow: 1,
                  "&:hover": { bgcolor: "#FFF1F2", color: "#DC2626" },
                }}
              >
                <X size={13} />
              </IconButton>
            </div>
            <p className="mt-1 truncate text-[11px] font-semibold text-[#071333]">
              {item.itemName}
            </p>
            <p className="truncate text-[10px] text-[#71809A]">
              {item.quantity} {unitLabel(item.pricingUnit)} · ₹
              {money(item.quantity * item.unitPrice)}
              {item.discountAmount > 0 ? " after discount" : ""}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function pricedServices(
  item: TariffItem,
  sheet: TariffSheet,
  bookingType: BookingType,
  discountGroup?: DiscountGroupPricing,
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
    return [
      {
        serviceId: service.id,
        serviceName: service.name,
        ...(() => {
          const pricing = calculateDiscountedPrice(
            rate.price,
            discountGroup?.rules.find((rule) => rule.serviceId === service.id),
            discountGroup?.isActive ?? false,
          );
          return {
            basePrice: pricing.basePrice,
            price: pricing.finalPrice,
            discountType: pricing.discountType,
            discountValue: pricing.discountValue,
            discountAmount: pricing.discountAmount,
          };
        })(),
        pricingUnit: rate.pricingUnit,
      },
    ];
  });
}

async function requestBookingData(
  tariffId?: string,
  categoryId?: string,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams();
  if (tariffId) params.set("tariffId", tariffId);
  if (categoryId) params.set("categoryId", categoryId);
  const response = await apiFetch(
    `/api/admin/orders/booking-data${params.size ? `?${params}` : ""}`,
    { cache: "no-store", credentials: "same-origin", signal },
  );
  const body = (await response.json().catch(() => null)) as
    (BookingData & { message?: string }) | null;
  if (!response.ok || !body) {
    throw new Error(body?.message ?? "Unable to load booking items.");
  }
  return body;
}

export function BookNewOrder() {
  const router = useRouter();
  const [step, setStep] = useState<BookingStep>(stepFromUrl);
  const stageRef = useRef<HTMLDivElement>(null);
  const [pendingChange, setPendingChange] = useState<
    | { type: "booking"; value: BookingType }
    | { type: "tariff"; value: string }
    | null
  >(null);
  const [bookingType, setBookingType] = useState<BookingType>("general");
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [tariffs, setTariffs] = useState<RateCardGroup[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [charges, setCharges] = useState<OrderCharge[]>([]);
  const [discountGroups, setDiscountGroups] = useState<DiscountGroupPricing[]>(
    [],
  );
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
  const [deliveryAt, setDeliveryAt] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [orderRemark, setOrderRemark] = useState("");
  const [extraCharge, setExtraCharge] = useState("none");
  const [customChargeAmount, setCustomChargeAmount] = useState("");
  const [customChargeDialogOpen, setCustomChargeDialogOpen] = useState(false);
  const [deliveryChargeCodes, setDeliveryChargeCodes] = useState<string[]>([]);
  const [taxChargeCodes, setTaxChargeCodes] = useState<string[]>([]);
  const [deliveryScheduled, setDeliveryScheduled] = useState(true);
  const [packagePlan, setPackagePlan] = useState("none");
  const [offer, setOffer] = useState("none");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceMethod, setAdvanceMethod] = useState("cash");
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

  function goToStep(next: BookingStep) {
    setStep(next);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (next === 0) url.searchParams.delete("step");
    else url.searchParams.set("step", String(next));
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  const loadData = useCallback(
    async (nextTariffId?: string, nextCategoryId?: string) => {
      const requestId = requestNumber.current + 1;
      requestNumber.current = requestId;
      setLoading(true);
      setError(null);
      try {
        const data = await queryClient.fetchQuery({
          queryKey: [
            "admin",
            "booking-data",
            nextTariffId ?? "",
            nextCategoryId ?? "",
          ],
          queryFn: ({ signal }) =>
            requestBookingData(nextTariffId, nextCategoryId, signal),
        });
        if (requestNumber.current !== requestId) return;
        setCategories(data.categories);
        setTariffs(data.tariffs);
        setCustomers(data.customers);
        setCharges(data.charges);
        setDiscountGroups(data.discountGroups);
        setTariffId(data.tariffId === null ? "" : String(data.tariffId));
        setCategoryId(data.categoryId === null ? "" : String(data.categoryId));
        setSheet(data.sheet);
      } catch (reason) {
        if (requestNumber.current !== requestId) return;
        setSheet(null);
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load booking items.",
        );
      } finally {
        if (requestNumber.current === requestId) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    stageRef.current?.focus();
    stageRef.current?.scrollIntoView({ block: "start" });
  }, [step]);

  useEffect(() => {
    setPickupAt((current) => current || localDateTimeValue(60));
    setMinimumPickupAt(localDateTimeValue(16));
    setDeliveryAt((current) => current || localDateTimeValue(60 * 48));
  }, []);

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const customer = customers.find((item) => item.id === customerId);
    const discountGroup = discountGroups.find(
      (group) => group.id === customer?.discountGroupId,
    );
    return (sheet?.items ?? []).filter((item) => {
      const hasPrice = sheet
        ? pricedServices(item, sheet, bookingType, discountGroup).length > 0
        : false;
      return (
        hasPrice &&
        (!normalized || item.name.toLowerCase().includes(normalized))
      );
    });
  }, [bookingType, customerId, customers, discountGroups, query, sheet]);

  const selectedCustomer = customers.find(
    (customer) => customer.id === customerId,
  );
  const selectedDiscountGroup = discountGroups.find(
    (group) => group.id === selectedCustomer?.discountGroupId,
  );
  const selectedItem =
    visibleItems.find((item) => item.id === selectedItemId) ?? null;
  const selectedServices =
    selectedItem && sheet
      ? pricedServices(selectedItem, sheet, bookingType, selectedDiscountGroup)
      : [];
  const selectedService =
    selectedServices.find(
      (service) => String(service.serviceId) === serviceId,
    ) ??
    selectedServices[0] ??
    null;
  const numericQuantity = Number(quantity);
  const lineAmount =
    selectedService && Number.isFinite(numericQuantity)
      ? selectedService.price * numericQuantity
      : 0;
  const orderTotal = addedItems.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );
  const chargeByCode = useMemo(
    () => new Map(charges.map((charge) => [charge.code, charge])),
    [charges],
  );
  const extraCharges = charges.filter((charge) => charge.type === "extra");
  const deliveryCharges = charges.filter(
    (charge) => charge.type === "delivery",
  );
  const taxCharges = charges.filter((charge) => charge.type === "tax");
  const enteredCustomCharge = Number(customChargeAmount);
  const extraChargeAmount =
    extraCharge === "custom" && Number.isFinite(enteredCustomCharge)
      ? Math.max(0, enteredCustomCharge)
      : (chargeByCode.get(extraCharge)?.amount ?? 0);
  const deliveryChargeAmount = deliveryChargeCodes.reduce(
    (total, code) => total + (chargeByCode.get(code)?.amount ?? 0),
    0,
  );
  const taxRate = taxChargeCodes.reduce(
    (total, code) => total + (chargeByCode.get(code)?.amount ?? 0),
    0,
  );
  const discountAmount = addedItems.reduce(
    (total, item) => total + item.quantity * item.discountAmount,
    0,
  );
  const taxableAmount = Math.max(
    0,
    orderTotal + extraChargeAmount + deliveryChargeAmount,
  );
  const gstAmount = taxableAmount * (taxRate / 100);
  const payableTotal = taxableAmount + gstAmount;
  const numericAdvance = Number(advanceAmount);
  const collectedAdvance = Number.isFinite(numericAdvance)
    ? Math.min(Math.max(numericAdvance, 0), payableTotal)
    : 0;

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

  function applyBookingType(next: BookingType) {
    if (next !== bookingType) {
      setBookingType(next);
      setAddedItems([]);
      clearSelectedItem();
      setQuery("");
    }
    goToStep(1);
  }

  function changeBookingType(next: BookingType) {
    if (next !== bookingType && addedItems.length) {
      setPendingChange({ type: "booking", value: next });
      return;
    }
    applyBookingType(next);
  }

  function applyTariff(nextTariffId: string) {
    setAddedItems([]);
    clearSelectedItem();
    setTariffId(nextTariffId);
    void loadData(nextTariffId, categoryId);
  }

  function changeTariff(nextTariffId: string) {
    if (nextTariffId === tariffId) return;
    if (addedItems.length) {
      setPendingChange({ type: "tariff", value: nextTariffId });
      return;
    }
    applyTariff(nextTariffId);
  }

  function changeCategory(nextCategoryId: string) {
    if (nextCategoryId === categoryId) return;
    clearSelectedItem();
    setQuery("");
    setCategoryId(nextCategoryId);
    void loadData(tariffId, nextCategoryId);
  }

  function repriceAddedItems(items: AddedItem[], groupId: number | null) {
    const group = discountGroups.find((item) => item.id === groupId);
    return items.map((item) => {
      const pricing = calculateDiscountedPrice(
        item.baseUnitPrice,
        group?.rules.find((rule) => rule.serviceId === item.serviceId),
        group?.isActive ?? false,
      );
      return {
        ...item,
        baseUnitPrice: pricing.basePrice,
        unitPrice: pricing.finalPrice,
        discountType: pricing.discountType,
        discountValue: pricing.discountValue,
        discountAmount: pricing.discountAmount,
      };
    });
  }

  function selectCustomer(customer: Customer | null) {
    setCustomerId(customer?.id ?? "");
    setAddedItems((current) =>
      repriceAddedItems(current, customer?.discountGroupId ?? null),
    );
  }

  function chooseItem(item: TariffItem) {
    if (!sheet) return;
    const firstService = pricedServices(
      item,
      sheet,
      bookingType,
      selectedDiscountGroup,
    )[0];
    setSelectedItemId(item.id);
    setServiceId(firstService ? String(firstService.serviceId) : "");
    resetItemForm();
  }

  function addItem(closeAfterAdd: boolean) {
    if (!selectedItem || !selectedService || !tariffId || !categoryId) return;
    const validQuantity =
      bookingType === "general"
        ? Number.isInteger(numericQuantity) &&
          numericQuantity >= 1 &&
          numericQuantity <= 100
        : Number.isFinite(numericQuantity) &&
          numericQuantity > 0 &&
          numericQuantity <= 1000;
    if (!validQuantity) {
      toast.error(
        bookingType === "general"
          ? "Enter a quantity from 1 to 100."
          : "Enter a weight from 0.01 to 1000 kg.",
      );
      return;
    }

    setAddedItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        tariffId: Number(tariffId),
        categoryId: Number(categoryId),
        itemId: selectedItem.id,
        imagePath: selectedItem.imagePath ?? "",
        itemName: selectedItem.name,
        serviceId: selectedService.serviceId,
        serviceName: selectedService.serviceName,
        quantity: numericQuantity,
        baseUnitPrice: selectedService.basePrice,
        unitPrice: selectedService.price,
        discountType: selectedService.discountType,
        discountValue: selectedService.discountValue,
        discountAmount: selectedService.discountAmount,
        pricingUnit: selectedService.pricingUnit,
        packingType,
        brand: brand.trim(),
        fabric,
        defect,
        color: color.trim(),
        remark: remark.trim(),
      },
    ]);
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
    if (
      !customerHouse.trim() ||
      !customerStreet.trim() ||
      !customerCity.trim()
    ) {
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
      const response = await apiFetch("/api/customers", {
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
          rateCard:
            tariffs.find((tariff) => String(tariff.id) === tariffId)?.name ??
            "",
          paymentMethod: "cash",
          creditCustomer: false,
          creditLimit: null,
          pickupInstructions: "",
          internalNotes: "",
          status: "active",
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        customer?: Customer;
        message?: string;
      } | null;
      if (!response.ok || !data?.customer) {
        setCustomerError(data?.message ?? "Unable to add customer.");
        return;
      }
      setCustomers((current) => [
        data.customer!,
        ...current.filter((customer) => customer.id !== data.customer!.id),
      ]);
      selectCustomer(data.customer);
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
      const response = await apiFetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          tariffId: Number(tariffId),
          bookingType,
          pickupAt: new Date(pickupAt).toISOString(),
          paymentMethod,
          instructions: orderRemark.trim(),
          idempotencyKey: crypto.randomUUID(),
          chargeCodes: [
            extraCharge !== "none" && extraCharge !== "custom"
              ? extraCharge
              : null,
            ...deliveryChargeCodes,
            ...taxChargeCodes,
          ].filter((code): code is string => Boolean(code)),
          customChargeAmount:
            extraCharge === "custom" ? enteredCustomCharge : null,
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
      const data = (await response.json().catch(() => null)) as {
        order?: { id: string };
        message?: string;
      } | null;
      if (!response.ok || !data?.order) {
        toast.error(data?.message ?? "Unable to place order.");
        return;
      }
      toast.success(`Order ${data.order.id} placed`);
      startNavigationProgress();
      router.push(`/admin/orders/${data.order.id}`);
    } catch {
      toast.error(
        "Unable to place order. Check your connection and try again.",
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  const categoryName = categories.find(
    (category) => String(category.id) === categoryId,
  )?.name;

  const bookingLabel =
    bookingType === "general" ? "General Booking" : "Package Booking";
  const emptyMessage = !tariffs.length
    ? "No active tariff is available."
    : !categories.length
      ? "No active category is available."
      : query
        ? "No items match your search."
        : `No ${bookingType === "general" ? "per-piece" : "per-kg"} prices in this category.`;

  return (
    <div ref={stageRef} tabIndex={-1} className="space-y-4 outline-none">
      {step === 0 && (
        <div className="rounded-lg border border-[#DCE6F2] bg-white p-3 sm:p-5">
          <BookingTypeOptions onSelect={changeBookingType} />
        </div>
      )}

      {step === 1 && (
        <div className="flex h-[calc(100dvh-88px)] min-h-0 flex-col gap-3 overflow-hidden rounded-lg border border-[#DCE6F2] bg-white p-3 md:h-[calc(100dvh-104px)] sm:p-4">
          <Stack
            flexShrink={0}
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ sm: "center" }}
            justifyContent="space-between"
            gap={2}
          >
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Button variant="outline" onClick={() => goToStep(0)}>
                <ArrowLeft /> Back
              </Button>
              <h2 className="text-[15px] font-semibold text-[#071333]">
                {bookingLabel}
              </h2>
            </Stack>
            <label className={labelClassName}>
              Tariff
              <MuiSelect
                aria-label="Tariff"
                value={tariffId}
                disabled={loading || !tariffs.length}
                onChange={(event) => changeTariff(event.target.value)}
                className={`${selectClassName} mt-1`}
              >
                {!tariffs.length && (
                  <option value="">No tariff available</option>
                )}
                {tariffs.map((tariff) => (
                  <option key={tariff.id} value={tariff.id}>
                    {tariff.name}
                  </option>
                ))}
              </MuiSelect>
            </label>
          </Stack>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <BookingItemPicker
              categories={categories}
              categoryId={categoryId}
              loading={loading}
              error={error}
              emptyMessage={emptyMessage}
              query={query}
              items={visibleItems.map((item) => {
                const services = sheet
                  ? pricedServices(item, sheet, bookingType)
                  : [];
                const minPrice = Math.min(
                  ...services.map((service) => service.price),
                );
                return {
                  item,
                  price: `From ₹${money(minPrice)} / ${bookingType === "general" ? "piece" : "kg"}`,
                  added: addedItems.filter((added) => added.itemId === item.id)
                    .length,
                };
              })}
              onCategory={changeCategory}
              onSearch={setQuery}
              onItem={chooseItem}
              onRetry={() => void loadData(tariffId, categoryId)}
            />
            <AddedItemsSummary
              items={addedItems}
              onRemove={(id) =>
                setAddedItems((current) =>
                  current.filter((item) => item.id !== id),
                )
              }
            />
          </div>
          <Box
            sx={{
              position: "sticky",
              flexShrink: 0,
              bottom: 0,
              zIndex: 2,
              bgcolor: "background.paper",
              borderTop: 1,
              borderColor: "divider",
              py: 1.5,
              px: { xs: 1, sm: 2 },
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <div aria-live="polite" className="text-[12px] text-[#52627A]">
              {addedItems.length} item{addedItems.length === 1 ? "" : "s"} added
              <span className="ml-3 font-semibold text-[#071333]">
                ₹{money(orderTotal)}
              </span>
            </div>
            <Button disabled={!addedItems.length} onClick={() => goToStep(2)}>
              Review order <ArrowRight />
            </Button>
          </Box>
        </div>
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
                  <p className="text-[11px] font-medium text-[#52627A]">
                    Category
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-[#071333]">
                    {categoryName}
                  </p>
                </div>
                <div className="rounded border border-[#CFE0FA] bg-white px-3 py-2 text-right">
                  <p className="text-[10px] text-[#52627A]">Price</p>
                  <p className="mt-1 text-[15px] font-semibold text-[#075DFF]">
                    ₹{money(selectedService.price)} /{" "}
                    {unitLabel(selectedService.pricingUnit)}
                  </p>
                  {selectedService.discountAmount > 0 ? (
                    <p className="mt-1 text-[10px] text-[#16803C]">
                      ₹{money(selectedService.basePrice)} less{" "}
                      {selectedService.discountType === "Percentage"
                        ? `${selectedService.discountValue}%`
                        : `₹${money(selectedService.discountValue)}`}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4">
                <span className={labelClassName}>Service</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {selectedServices.map((service) => (
                    <MuiAction
                      key={service.serviceId}
                      type="button"
                      aria-pressed={
                        service.serviceId === selectedService.serviceId
                      }
                      onClick={() => setServiceId(String(service.serviceId))}
                      className={cn(
                        "rounded border px-3 py-2 text-[11px] transition-colors",
                        service.serviceId === selectedService.serviceId
                          ? "border-[#075DFF] bg-[#EEF5FF] font-medium text-[#075DFF]"
                          : "border-[#DCE6F2] bg-white text-[#385071] hover:bg-[#F7FAFF]",
                      )}
                    >
                      {service.serviceName} · ₹{money(service.price)}
                    </MuiAction>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className={labelClassName}>
                  {bookingType === "general" ? "Quantity" : "Weight (kg)"}
                  {bookingType === "general" ? (
                    <span className="mt-1.5 flex h-9 overflow-hidden rounded border border-[#DCE6F2] bg-white">
                      <MuiAction
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          setQuantity(
                            String(
                              Math.max(1, Math.floor(numericQuantity || 1) - 1),
                            ),
                          )
                        }
                        className="flex w-9 items-center justify-center text-[#385071] hover:bg-[#EEF5FF] hover:text-[#075DFF]"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </MuiAction>
                      <MuiInput
                        aria-label="Quantity"
                        value={quantity}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={100}
                        onChange={(event) => setQuantity(event.target.value)}
                        className="min-w-0 flex-1 border-x border-[#DCE6F2] bg-white px-2 text-center text-[12px] outline-none"
                      />
                      <MuiAction
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() =>
                          setQuantity(
                            String(
                              Math.min(
                                100,
                                Math.floor(numericQuantity || 0) + 1,
                              ),
                            ),
                          )
                        }
                        className="flex w-9 items-center justify-center text-[#385071] hover:bg-[#EEF5FF] hover:text-[#075DFF]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </MuiAction>
                    </span>
                  ) : (
                    <Input
                      aria-label="Weight (kg)"
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
                  <MuiSelect
                    value={packingType}
                    onChange={(event) => setPackingType(event.target.value)}
                    className={`${selectClassName} mt-1.5`}
                  >
                    <option value="">Select packaging</option>
                    {PACKING_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </MuiSelect>
                </label>
                <label className={labelClassName}>
                  Brand
                  <Input
                    value={brand}
                    maxLength={80}
                    onChange={(event) => setBrand(event.target.value)}
                    placeholder="Optional"
                    className="mt-1.5 shadow-none"
                  />
                </label>
                <label className={labelClassName}>
                  Fabric
                  <MuiSelect
                    value={fabric}
                    onChange={(event) => setFabric(event.target.value)}
                    className={`${selectClassName} mt-1.5`}
                  >
                    <option value="">Select fabric</option>
                    {FABRIC_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </MuiSelect>
                </label>
                <label className={labelClassName}>
                  Defect
                  <MuiSelect
                    value={defect}
                    onChange={(event) =>
                      setDefect(
                        event.target.value as (typeof DEFECT_TYPES)[number],
                      )
                    }
                    className={`${selectClassName} mt-1.5`}
                  >
                    {DEFECT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </MuiSelect>
                </label>
                <label className={labelClassName}>
                  Color
                  <Input
                    value={color}
                    maxLength={40}
                    onChange={(event) => setColor(event.target.value)}
                    placeholder="Optional"
                    className="mt-1.5 shadow-none"
                  />
                </label>
                <label className={`${labelClassName} sm:col-span-2`}>
                  Remark
                  <Input
                    value={remark}
                    maxLength={160}
                    onChange={(event) => setRemark(event.target.value)}
                    placeholder="Optional"
                    className="mt-1.5 shadow-none"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E1E9F2] pt-4">
                <p className="text-[12px] text-[#52627A]">
                  Amount{" "}
                  <span className="ml-1 text-[16px] font-semibold text-[#071333]">
                    ₹{money(lineAmount)}
                  </span>
                </p>
                <div className="flex flex-1 justify-end gap-2 sm:flex-none">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    onClick={() => addItem(false)}
                  >
                    <Plus /> Add and continue
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 sm:flex-none"
                    onClick={() => addItem(true)}
                  >
                    <Check /> Add &amp; close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      {step === 2 && (
        <section
          aria-label="Order review"
          className="flex h-[calc(100dvh-88px)] min-h-0 min-w-0 flex-col gap-3 md:h-[calc(100dvh-104px)]"
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-[#DCE6F2] bg-white px-3 py-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.045)] sm:px-4">
            <div className="flex items-center gap-2.5">
              <Button variant="outline" onClick={() => goToStep(1)}>
                <ArrowLeft /> Back to items
              </Button>
              <h2 className="text-[15px] font-semibold text-[#071333]">
                Review order
              </h2>
            </div>
            <Chip label={bookingLabel} size="small" />
          </div>
          <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:grid-rows-1">
            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[#DCE6F2] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.045)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#DCE6F2] bg-[#F5F8FF] px-4 py-3">
                <h3 className="text-[13px] font-semibold text-[#071333]">
                  Order items
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#71809A]">
                    {addedItems.length} item{addedItems.length === 1 ? "" : "s"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToStep(1)}
                  >
                    <Plus /> Add item
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {addedItems.length ? (
                  <div className="divide-y divide-[#EDF1F6]">
                    {addedItems.map((item) => {
                      const details = [
                        item.packingType,
                        item.brand,
                        item.fabric,
                        item.defect !== "None" ? item.defect : "",
                        item.color,
                        item.remark,
                      ].filter(Boolean);
                      return (
                        <div
                          key={item.id}
                          className="flex gap-3 p-3 sm:gap-4 sm:p-4"
                        >
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#DCE6F2] bg-[#EEF5FF] sm:h-16 sm:w-16">
                            {item.imagePath ? (
                              <Image
                                src={item.imagePath}
                                alt={item.itemName}
                                width={64}
                                height={64}
                                className="h-full w-full object-contain p-1"
                              />
                            ) : (
                              <span className="text-lg font-semibold text-[#075DFF]">
                                {item.itemName.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                              <div>
                                <p className="break-words text-[13px] font-semibold text-[#071333]">
                                  {item.itemName}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[#52627A]">
                                  {item.serviceName}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-col items-end">
                                {item.discountAmount > 0 ? (
                                  <p className="text-[10px] text-[#71809A] line-through">
                                    ₹{money(item.quantity * item.baseUnitPrice)}
                                  </p>
                                ) : null}
                                <p className="text-[14px] font-semibold text-[#071333]">
                                  ₹{money(item.quantity * item.unitPrice)}
                                </p>
                                {item.discountAmount > 0 ? (
                                  <p className="text-[10px] text-[#16803C]">
                                    −₹
                                    {money(item.quantity * item.discountAmount)}
                                  </p>
                                ) : null}
                                <IconButton
                                  size="small"
                                  title={`Remove ${item.itemName}`}
                                  aria-label={`Remove ${item.itemName}`}
                                  onClick={() =>
                                    setAddedItems((current) =>
                                      current.filter(
                                        (entry) => entry.id !== item.id,
                                      ),
                                    )
                                  }
                                  sx={{
                                    mt: 0.25,
                                    mr: -0.75,
                                    color: "#DC2626",
                                    "&:hover": {
                                      bgcolor: "#FFF1F2",
                                      color: "#B91C1C",
                                    },
                                  }}
                                >
                                  <Trash2 size={16} />
                                </IconButton>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#71809A]">
                              <span>
                                {item.quantity} {unitLabel(item.pricingUnit)} ×
                                ₹{money(item.unitPrice)}
                              </span>
                              {item.discountAmount > 0 ? (
                                <span className="text-[#16803C]">
                                  {item.discountType === "Percentage"
                                    ? `${item.discountValue}%`
                                    : `₹${money(item.discountValue)}`}{" "}
                                  store discount
                                </span>
                              ) : null}
                              {details.map((detail) => (
                                <span key={detail}>{detail}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex min-h-full items-center justify-center px-4 text-center text-[11px] text-[#71809A]">
                    No items added.
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-[#DCE6F2] bg-[#F5F8FF] px-4 py-3">
                <span className="text-[12px] font-medium text-[#52627A]">
                  Items subtotal
                </span>
                <span className="text-[18px] font-semibold text-[#071333]">
                  ₹{money(orderTotal)}
                </span>
              </div>
            </div>

            <div className="flex min-h-0 min-w-0 flex-col gap-2">
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: "#DCE6F2",
                    borderRadius: "8px !important",
                    overflow: "hidden",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ChevronDown size={17} />}
                    sx={{
                      minHeight: 50,
                      px: 2,
                      "& .MuiAccordionSummary-content": { my: 1.25 },
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1}>
                      <FileText size={17} color="#075DFF" />
                      <span className="text-[13px] font-semibold text-[#071333]">
                        Additional info
                      </span>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      borderTop: 1,
                      borderColor: "#EDF1F6",
                      px: 2,
                      py: 1.75,
                    }}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className={labelClassName}>
                        Add charges
                        <MuiSelect
                          value={extraCharge}
                          onChange={(event) => {
                            const value = event.target.value;
                            if (value === "custom") {
                              setCustomChargeDialogOpen(true);
                              return;
                            }
                            setExtraCharge(value);
                          }}
                          className={`${selectClassName} mt-1.5`}
                        >
                          <option value="none">No extra charge</option>
                          {extraCharges.map((charge) => (
                            <option key={charge.code} value={charge.code}>
                              {charge.name} · ₹{money(charge.amount)}
                            </option>
                          ))}
                          <option value="custom">Custom charge</option>
                        </MuiSelect>
                      </label>
                      <div className={labelClassName}>
                        Store discount
                        <div className="mt-1.5 flex h-9 items-center rounded border border-[#DCE6F2] bg-[#FAFCFF] px-3 text-[12px] font-normal text-[#52627A]">
                          {selectedDiscountGroup
                            ? "Service-wise discount applied"
                            : selectedCustomer
                              ? "No discount group assigned"
                              : "Choose a customer to apply discounts"}
                        </div>
                      </div>
                    </div>
                    {extraCharge === "custom" ? (
                      <div className="mt-3 flex items-center justify-between gap-3 rounded border border-[#DCE6F2] bg-[#FAFCFF] px-3 py-2 sm:w-1/2">
                        <span className="text-[11px] text-[#52627A]">
                          Custom charge: ₹{money(extraChargeAmount)}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomChargeDialogOpen(true)}
                        >
                          Edit
                        </Button>
                      </div>
                    ) : null}
                    <div className="mt-2 grid gap-x-2 sm:grid-cols-2">
                      {taxCharges.map((charge) => (
                        <FormControlLabel
                          key={charge.code}
                          control={
                            <Checkbox
                              size="small"
                              checked={taxChargeCodes.includes(charge.code)}
                              onChange={() =>
                                setTaxChargeCodes((current) =>
                                  current.includes(charge.code)
                                    ? current.filter(
                                        (code) => code !== charge.code,
                                      )
                                    : [...current, charge.code],
                                )
                              }
                            />
                          }
                          label={`${charge.name} · ${money(charge.amount)}%`}
                          sx={{
                            m: 0,
                            "& .MuiFormControlLabel-label": {
                              fontSize: 12,
                              color: "#385071",
                            },
                          }}
                        />
                      ))}
                      {deliveryCharges.map((charge) => (
                        <FormControlLabel
                          key={charge.code}
                          control={
                            <Checkbox
                              size="small"
                              checked={deliveryChargeCodes.includes(
                                charge.code,
                              )}
                              onChange={() =>
                                setDeliveryChargeCodes((current) =>
                                  current.includes(charge.code)
                                    ? current.filter(
                                        (code) => code !== charge.code,
                                      )
                                    : [...current, charge.code],
                                )
                              }
                            />
                          }
                          label={`${charge.name} · ₹${money(charge.amount)}`}
                          sx={{
                            m: 0,
                            "& .MuiFormControlLabel-label": {
                              fontSize: 12,
                              color: "#385071",
                            },
                          }}
                        />
                      ))}
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={deliveryScheduled}
                            onChange={(event) =>
                              setDeliveryScheduled(event.target.checked)
                            }
                          />
                        }
                        label="Delivery scheduled"
                        sx={{
                          m: 0,
                          "& .MuiFormControlLabel-label": {
                            fontSize: 12,
                            color: "#385071",
                          },
                        }}
                      />
                    </div>
                    <label className={`${labelClassName} mt-2 block`}>
                      Order remark
                      <TextField
                        value={orderRemark}
                        onChange={(event) => setOrderRemark(event.target.value)}
                        placeholder="Add a note for this order"
                        multiline
                        minRows={2}
                        maxRows={3}
                        inputProps={{
                          maxLength: 120,
                          "aria-label": "Order remark",
                        }}
                        size="small"
                        fullWidth
                        sx={{
                          mt: 0.75,
                          "& .MuiInputBase-root": { fontSize: 12 },
                        }}
                      />
                    </label>
                  </AccordionDetails>
                </Accordion>

                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: "#DCE6F2",
                    borderRadius: "8px !important",
                    overflow: "hidden",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ChevronDown size={17} />}
                    sx={{
                      minHeight: 50,
                      px: 2,
                      "& .MuiAccordionSummary-content": { my: 1.25 },
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1}>
                      <CircleDollarSign size={17} color="#075DFF" />
                      <span className="text-[13px] font-semibold text-[#071333]">
                        Payment details
                      </span>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      borderTop: 1,
                      borderColor: "#EDF1F6",
                      px: 2,
                      py: 1.75,
                    }}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="booking-customer"
                          className={labelClassName}
                        >
                          Customer
                        </label>
                        <div className="mt-1.5 flex gap-2">
                          <Autocomplete
                            id="booking-customer"
                            options={customers}
                            value={
                              customers.find(
                                (customer) => customer.id === customerId,
                              ) ?? null
                            }
                            onChange={(_, customer) => selectCustomer(customer)}
                            getOptionLabel={(customer) =>
                              `${customer.fullName} · ${customer.mobile}`
                            }
                            isOptionEqualToValue={(option, value) =>
                              option.id === value.id
                            }
                            noOptionsText="No customers found"
                            sx={{
                              minWidth: 0,
                              flex: 1,
                              "& .MuiInputBase-root": {
                                minHeight: 36,
                                fontSize: 12,
                                py: 0,
                              },
                              "& .MuiInputBase-input": { py: "8px" },
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Search customer"
                                inputProps={{
                                  ...params.inputProps,
                                  "aria-label": "Customer",
                                }}
                                size="small"
                              />
                            )}
                          />
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
                        Pickup date
                        <Input
                          type="datetime-local"
                          value={pickupAt}
                          min={minimumPickupAt}
                          onChange={(event) => setPickupAt(event.target.value)}
                          className="mt-1.5 shadow-none"
                        />
                      </label>
                      <label className={labelClassName}>
                        Delivery date
                        <Input
                          type="datetime-local"
                          value={deliveryAt}
                          min={pickupAt}
                          onChange={(event) =>
                            setDeliveryAt(event.target.value)
                          }
                          className="mt-1.5 shadow-none"
                        />
                      </label>
                      <label className={labelClassName}>
                        Payment method
                        <MuiSelect
                          value={paymentMethod}
                          onChange={(event) =>
                            setPaymentMethod(event.target.value)
                          }
                          className={`${selectClassName} mt-1.5`}
                        >
                          <option value="cash">Cash</option>
                          <option value="upi">UPI</option>
                          <option value="card">Card</option>
                        </MuiSelect>
                      </label>
                    </div>
                  </AccordionDetails>
                </Accordion>

                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: "#DCE6F2",
                    borderRadius: "8px !important",
                    overflow: "hidden",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ChevronDown size={17} />}
                    sx={{
                      minHeight: 50,
                      px: 2,
                      "& .MuiAccordionSummary-content": { my: 1.25 },
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1}>
                      <PackageCheck size={17} color="#075DFF" />
                      <span className="text-[13px] font-semibold text-[#071333]">
                        Package subscription
                      </span>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      borderTop: 1,
                      borderColor: "#EDF1F6",
                      px: 2,
                      py: 1.75,
                    }}
                  >
                    <label className={labelClassName}>
                      Select package
                      <MuiSelect
                        value={packagePlan}
                        onChange={(event) => setPackagePlan(event.target.value)}
                        className={`${selectClassName} mt-1.5`}
                      >
                        <option value="none">No package</option>
                        <option value="monthly-10">Monthly care · 10 kg</option>
                        <option value="family-20">
                          Family care · 20 items
                        </option>
                      </MuiSelect>
                    </label>
                  </AccordionDetails>
                </Accordion>

                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: "#DCE6F2",
                    borderRadius: "8px !important",
                    overflow: "hidden",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ChevronDown size={17} />}
                    sx={{
                      minHeight: 50,
                      px: 2,
                      "& .MuiAccordionSummary-content": { my: 1.25 },
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Percent size={17} color="#075DFF" />
                      <span className="text-[13px] font-semibold text-[#071333]">
                        Offer
                      </span>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      borderTop: 1,
                      borderColor: "#EDF1F6",
                      px: 2,
                      py: 1.75,
                    }}
                  >
                    <label className={labelClassName}>
                      Select offer
                      <MuiSelect
                        value={offer}
                        onChange={(event) => setOffer(event.target.value)}
                        className={`${selectClassName} mt-1.5`}
                      >
                        <option value="none">No offer</option>
                        <option value="welcome">WELCOME10 · 10% off</option>
                        <option value="weekend">WEEKEND · 5% off</option>
                      </MuiSelect>
                    </label>
                  </AccordionDetails>
                </Accordion>

                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: "#DCE6F2",
                    borderRadius: "8px !important",
                    overflow: "hidden",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ChevronDown size={17} />}
                    sx={{
                      minHeight: 50,
                      px: 2,
                      "& .MuiAccordionSummary-content": { my: 1.25 },
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1}>
                      <ReceiptText size={17} color="#075DFF" />
                      <span className="text-[13px] font-semibold text-[#071333]">
                        Collect advance payment
                      </span>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      borderTop: 1,
                      borderColor: "#EDF1F6",
                      px: 2,
                      py: 1.75,
                    }}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className={labelClassName}>
                        Advance amount
                        <Input
                          type="number"
                          min={0}
                          max={payableTotal}
                          step="0.01"
                          value={advanceAmount}
                          onChange={(event) =>
                            setAdvanceAmount(event.target.value)
                          }
                          placeholder="₹0"
                          className="mt-1.5 shadow-none"
                        />
                      </label>
                      <label className={labelClassName}>
                        Collect by
                        <MuiSelect
                          value={advanceMethod}
                          onChange={(event) =>
                            setAdvanceMethod(event.target.value)
                          }
                          className={`${selectClassName} mt-1.5`}
                        >
                          <option value="cash">Cash</option>
                          <option value="upi">UPI</option>
                          <option value="card">Card</option>
                        </MuiSelect>
                      </label>
                    </div>
                  </AccordionDetails>
                </Accordion>
              </div>

              <div className="shrink-0 rounded-lg border border-[#CFE0FF] bg-[#F5F8FF] p-3">
                <div className="space-y-1.5 text-[12px]">
                  <div className="flex justify-between gap-3 text-[#52627A]">
                    <span>Items subtotal</span>
                    <span>₹{money(orderTotal)}</span>
                  </div>
                  {discountAmount > 0 ? (
                    <div className="flex justify-between gap-3 text-[#16803C]">
                      <span>Discount</span>
                      <span>-₹{money(discountAmount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-3 text-[#52627A]">
                    <span>Extra charges</span>
                    <span>
                      ₹{money(extraChargeAmount + deliveryChargeAmount)}
                    </span>
                  </div>
                  {gstAmount > 0 ? (
                    <div className="flex justify-between gap-3 text-[#52627A]">
                      <span>GST</span>
                      <span>₹{money(gstAmount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-3 border-t border-[#CFE0FF] pt-2 text-[15px] font-semibold text-[#071333]">
                    <span>Total payable</span>
                    <span>₹{money(payableTotal)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-[#52627A]">
                    <span>Advance collected</span>
                    <span>₹{money(collectedAdvance)}</span>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    disabled={
                      placingOrder ||
                      !addedItems.length ||
                      !customerId ||
                      !pickupAt
                    }
                    onClick={() => void placeOrder()}
                    className="min-w-[150px]"
                  >
                    {placingOrder ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <ShoppingCart />
                    )}
                    {placingOrder ? "Placing order..." : "Place order"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <Dialog
        open={Boolean(pendingChange)}
        onOpenChange={(open) => {
          if (!open) setPendingChange(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Clear added items?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <p className="text-[13px] text-[#52627A]">
              Changing the booking type or tariff will remove the items in this
              order.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPendingChange(null)}>
                Keep items
              </Button>
              <Button
                onClick={() => {
                  if (pendingChange?.type === "booking")
                    applyBookingType(pendingChange.value);
                  else if (pendingChange?.type === "tariff")
                    applyTariff(pendingChange.value);
                  setPendingChange(null);
                }}
              >
                Clear and change
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={customChargeDialogOpen}
        onOpenChange={setCustomChargeDialogOpen}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enter custom charge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <label className={labelClassName}>
              Charge amount
              <Input
                autoFocus
                type="number"
                min={0}
                max={100000}
                step="0.01"
                inputMode="decimal"
                value={customChargeAmount}
                onChange={(event) => setCustomChargeAmount(event.target.value)}
                placeholder="₹0"
                className="mt-1.5 shadow-none"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCustomChargeDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (
                    !customChargeAmount.trim() ||
                    !Number.isFinite(enteredCustomCharge) ||
                    enteredCustomCharge < 0 ||
                    enteredCustomCharge > 100000
                  ) {
                    toast.error("Enter a valid charge amount.");
                    return;
                  }
                  setExtraCharge("custom");
                  setCustomChargeDialogOpen(false);
                }}
              >
                Save charge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  onChange={(event) =>
                    setCustomerMobile(
                      event.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  className="mt-1.5 shadow-none"
                />
              </label>
              <label className={labelClassName}>
                Pincode
                <Input
                  value={customerPincode}
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) =>
                    setCustomerPincode(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  className="mt-1.5 shadow-none"
                />
              </label>
              <label className={labelClassName}>
                House/Flat no.
                <Input
                  value={customerHouse}
                  maxLength={100}
                  onChange={(event) => setCustomerHouse(event.target.value)}
                  className="mt-1.5 shadow-none"
                />
              </label>
              <label className={labelClassName}>
                Street/Area
                <Input
                  value={customerStreet}
                  maxLength={200}
                  onChange={(event) => setCustomerStreet(event.target.value)}
                  className="mt-1.5 shadow-none"
                />
              </label>
              <label className={labelClassName}>
                Landmark
                <Input
                  value={customerLandmark}
                  maxLength={150}
                  onChange={(event) => setCustomerLandmark(event.target.value)}
                  placeholder="Optional"
                  className="mt-1.5 shadow-none"
                />
              </label>
              <label className={labelClassName}>
                City
                <Input
                  value={customerCity}
                  maxLength={100}
                  onChange={(event) => setCustomerCity(event.target.value)}
                  className="mt-1.5 shadow-none"
                />
              </label>
            </div>
            {customerError ? (
              <p className="mt-3 rounded border border-red-100 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {customerError}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2 border-t border-[#E7EDF5] pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={customerSaving}
                onClick={() => setCustomerDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={customerSaving}
                onClick={() => void addCustomer()}
              >
                {customerSaving ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <UserPlus />
                )}
                {customerSaving ? "Adding..." : "Add customer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
