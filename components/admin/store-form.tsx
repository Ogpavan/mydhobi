"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChangeEventHandler, FormEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { ArrowLeft, Crosshair, ImageUp, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { startNavigationProgress } from "@/components/navigation-loader";
import type { SetupCity, SetupState } from "@/lib/locations";
import { cn } from "@/lib/utils";
import type { Store, StorePayload } from "@/lib/stores";

type StoreFormProps = {
  mode: "create" | "edit";
  store?: Store;
  locationStates?: SetupState[];
  locationCities?: SetupCity[];
};

type FieldProps = {
  label: string;
  name: keyof StorePayload;
  required?: boolean;
  type?: string;
  digitsOnly?: boolean;
  maxLength?: number;
  className?: string;
  defaultValue?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
};

function Field({
  label,
  name,
  required = false,
  type = "text",
  digitsOnly = false,
  maxLength,
  className,
  defaultValue,
  value,
  onChange,
  placeholder,
}: FieldProps) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-[#31405A]">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <Input
        name={name}
        type={type}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        inputMode={digitsOnly ? "numeric" : undefined}
        maxLength={maxLength}
        pattern={digitsOnly && maxLength ? `[0-9]{${maxLength}}` : undefined}
        title={
          digitsOnly && maxLength
            ? `Enter a ${maxLength}-digit number.`
            : undefined
        }
        onInput={(event) => {
          event.currentTarget.setCustomValidity("");

          if (digitsOnly) {
            const digits = event.currentTarget.value.replace(/\D/g, "");
            event.currentTarget.value = maxLength
              ? digits.slice(0, maxLength)
              : digits;
          }
        }}
        onInvalid={(event) => {
          if (digitsOnly && maxLength) {
            event.currentTarget.setCustomValidity(
              `Enter a ${maxLength}-digit number.`,
            );
          }
        }}
        className="h-[36px] rounded border-[#DCE6F2] text-sm font-normal shadow-none focus-visible:border-[#075DFF] focus-visible:ring-1 focus-visible:ring-[#075DFF]/20"
      />
    </label>
  );
}

type DurationFieldName = "processTime" | "tagDeliveryDateInterval";
type DurationUnit = "hours" | "minutes";

function parseDuration(value?: string): { amount: string; unit: DurationUnit } {
  if (!value) return { amount: "", unit: "hours" };

  const match = value.trim().match(/^(\d+)\s*(hours?|hrs?|minutes?|mins?|days?)$/i);
  if (!match) return { amount: "", unit: "hours" };

  const amount = match[1];
  const unit = match[2].toLowerCase();

  if (unit.startsWith("day")) {
    return { amount: String(Number(amount) * 24), unit: "hours" };
  }

  return {
    amount,
    unit: unit.startsWith("min") ? "minutes" : "hours",
  };
}

function DurationField({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: DurationFieldName;
  defaultValue?: string;
  placeholder: string;
}) {
  const duration = parseDuration(defaultValue);

  return (
    <fieldset className="block space-y-1.5">
      <legend className="text-xs font-medium text-[#31405A]">{label}</legend>
      <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-2">
        <Input
          name={`${name}Value`}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          defaultValue={duration.amount}
          placeholder={placeholder}
          aria-label={`${label} number`}
          className="h-[36px] rounded border-[#DCE6F2] text-sm font-normal shadow-none focus-visible:border-[#075DFF] focus-visible:ring-1 focus-visible:ring-[#075DFF]/20"
        />
        <select
          name={`${name}Unit`}
          defaultValue={duration.unit}
          aria-label={`${label} unit`}
          className="h-[36px] rounded border border-[#DCE6F2] bg-white px-2 text-sm font-normal text-[#071333] outline-none focus:border-[#075DFF] focus:ring-1 focus:ring-[#075DFF]/20"
        >
          <option value="hours">Hours</option>
          <option value="minutes">Minutes</option>
        </select>
      </div>
    </fieldset>
  );
}

function TextAreaField({
  label,
  name,
  className,
  inputClassName,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: keyof StorePayload;
  className?: string;
  inputClassName?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-[#31405A]">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={cn(
          "min-h-[82px] w-full resize-y rounded border border-[#DCE6F2] bg-white px-3 py-2 text-sm font-normal text-[#071333] shadow-none outline-none transition-colors focus:border-[#075DFF] focus:ring-1 focus:ring-[#075DFF]/20",
          inputClassName,
        )}
      />
    </label>
  );
}

function SectionCard({
  number,
  title,
  children,
  className,
}: {
  number: number;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#075DFF] text-xs font-medium text-white">
            {number}
          </div>
          <h2 className="text-sm font-medium leading-6 text-[#071333]">
            {title}
          </h2>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function getFormValue(formData: FormData, name: keyof StorePayload) {
  return String(formData.get(name) ?? "");
}

function getDurationValue(formData: FormData, name: DurationFieldName) {
  const amount = String(formData.get(`${name}Value`) ?? "").trim();
  const unit = formData.get(`${name}Unit`) === "minutes" ? "minutes" : "hours";

  return amount ? `${amount} ${unit}` : "";
}

function getStorePayload(formData: FormData): StorePayload {
  const status = getFormValue(formData, "status");

  return {
    name: getFormValue(formData, "name"),
    company: getFormValue(formData, "company"),
    email: getFormValue(formData, "email"),
    mobile: getFormValue(formData, "mobile"),
    processTime: getDurationValue(formData, "processTime"),
    tagDeliveryDateInterval: getDurationValue(
      formData,
      "tagDeliveryDateInterval",
    ),
    invoiceGenName: getFormValue(formData, "invoiceGenName"),
    invoiceGenNumber: getFormValue(formData, "invoiceGenNumber"),
    upiAccountName: getFormValue(formData, "upiAccountName"),
    upiAccountId: getFormValue(formData, "upiAccountId"),
    upiDisclaimer: getFormValue(formData, "upiDisclaimer"),
    notificationNote: getFormValue(formData, "notificationNote"),
    addressLine1: getFormValue(formData, "addressLine1"),
    addressLine2: getFormValue(formData, "addressLine2"),
    city: getFormValue(formData, "city"),
    state: getFormValue(formData, "state"),
    landmark: getFormValue(formData, "landmark"),
    pinCode: getFormValue(formData, "pinCode"),
    latitude: getFormValue(formData, "latitude"),
    longitude: getFormValue(formData, "longitude"),
    status: status === "draft" || status === "inactive" ? status : "active",
  };
}

function generateInvoiceNumber(storeName: string) {
  const words = storeName.match(/[a-z0-9]+/gi) ?? [];
  const prefix = words
    .slice(0, 2)
    .map((word) => word.slice(0, 3).toUpperCase())
    .join("-");

  return prefix ? `${prefix}-001` : "";
}

export function StoreForm({
  mode,
  store,
  locationStates = [],
  locationCities = [],
}: StoreFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialStoreName = store?.name ?? "";
  const generatedInvoiceNumber = generateInvoiceNumber(initialStoreName);
  const [storeName, setStoreName] = useState(initialStoreName);
  const [invoiceName, setInvoiceName] = useState(
    store?.invoiceGenName || initialStoreName,
  );
  const [invoiceNumber, setInvoiceNumber] = useState(
    store?.invoiceGenNumber || generatedInvoiceNumber,
  );
  const invoiceNameEdited = useRef(
    Boolean(store?.invoiceGenName && store.invoiceGenName !== initialStoreName),
  );
  const invoiceNumberEdited = useRef(
    Boolean(
      store?.invoiceGenNumber &&
        store.invoiceGenNumber !== generatedInvoiceNumber,
    ),
  );
  const isEdit = mode === "edit";
  const defaultLocationStateId =
    !isEdit && locationStates.length === 1 ? locationStates[0].id : "";
  const defaultLocationCities = locationCities.filter(
    (city) => city.stateId === defaultLocationStateId,
  );
  const [selectedLocationStateId, setSelectedLocationStateId] = useState(
    defaultLocationStateId,
  );
  const [selectedLocationCity, setSelectedLocationCity] = useState(
    defaultLocationCities.length === 1 ? defaultLocationCities[0].name : "",
  );
  const selectedLocationState = locationStates.find(
    (state) => state.id === selectedLocationStateId,
  );
  const availableLocationCities = locationCities.filter(
    (city) => city.stateId === selectedLocationStateId,
  );
  const locationIsReady =
    isEdit || Boolean(selectedLocationState && selectedLocationCity);

  function handleStoreNameChange(value: string) {
    setStoreName(value);

    if (!invoiceNameEdited.current) {
      setInvoiceName(value);
    }

    if (!invoiceNumberEdited.current) {
      setInvoiceNumber(generateInvoiceNumber(value));
    }
  }

  function handleLocationStateChange(stateId: string) {
    setSelectedLocationStateId(stateId);
    const citiesForState = locationCities.filter(
      (city) => city.stateId === stateId,
    );
    setSelectedLocationCity(
      citiesForState.length === 1 ? citiesForState[0].name : "",
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const payload = getStorePayload(new FormData(event.currentTarget));
    const endpoint = isEdit && store ? `/api/stores/${store.id}` : "/api/stores";

    try {
      const response = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "Unable to save store.");
        return;
      }

      toast.success(isEdit ? "Store updated" : "Store created");
      startNavigationProgress();
      router.push("/admin/store");
      router.refresh();
    } catch {
      setError("Unable to save store right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Current location is unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = document.querySelector<HTMLInputElement>(
          'input[name="latitude"]',
        );
        const longitude = document.querySelector<HTMLInputElement>(
          'input[name="longitude"]',
        );

        if (latitude) {
          latitude.value = String(position.coords.latitude);
        }

        if (longitude) {
          longitude.value = String(position.coords.longitude);
        }

        toast.success("Location captured");
      },
      () => toast.error("Unable to capture current location"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          asChild
          variant="outline"
          className="h-[34px] w-fit rounded border-[#DCE6F2] bg-white px-3 text-[13px] font-medium"
        >
          <Link href="/admin/store">
            <ArrowLeft className="h-4 w-4" />
            {isEdit ? "Back to Stores" : "Back"}
          </Link>
        </Button>

        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            className="h-[34px] rounded border-[#DCE6F2] bg-white px-3 text-[13px] font-medium"
          >
            <Link href="/admin/store">Cancel</Link>
          </Button>
          <Button
            disabled={isSubmitting || !locationIsReady}
            className="h-[34px] rounded bg-[#075DFF] px-3 text-[13px] font-medium shadow-[0_8px_18px_rgba(7,93,255,0.2)] hover:bg-[#064FEB]"
          >
            <Save className="h-4 w-4" />
            {isSubmitting
              ? "Saving..."
              : isEdit
                ? "Update Store"
                : "Save Store"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded border border-red-100 bg-red-50 px-3 py-2 text-sm font-normal text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <div className="space-y-4">
          <SectionCard
            number={1}
            title="Basic Details"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Store Name"
                name="name"
                required
                value={storeName}
                onChange={(event) => handleStoreNameChange(event.target.value)}
                placeholder="DhobiCart Indiranagar"
              />
              <Field
                label="Company"
                name="company"
                defaultValue={store?.company}
                placeholder="MyDhobi Services Pvt Ltd"
              />
              <Field
                label="Email Id"
                name="email"
                required
                type="email"
                defaultValue={store?.email}
                placeholder="store@mydhobi.com"
              />
              <Field
                label="Mobile Number"
                name="mobile"
                required
                type="tel"
                digitsOnly
                maxLength={10}
                defaultValue={store?.mobile}
                placeholder="9876543210"
              />
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#31405A]">
                  Status
                </span>
                <select
                  name="status"
                  defaultValue={store?.status ?? "active"}
                  className="h-[36px] w-full rounded border border-[#DCE6F2] bg-white px-3 text-sm font-normal text-[#071333] shadow-none outline-none transition-colors focus:border-[#075DFF] focus:ring-1 focus:ring-[#075DFF]/20"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
          </SectionCard>

          <SectionCard
            number={3}
            title="Payment Details"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Upi Account Name"
                name="upiAccountName"
                defaultValue={store?.upiAccountName}
                placeholder="MyDhobi Indiranagar"
              />
              <Field
                label="Upi Account Id"
                name="upiAccountId"
                defaultValue={store?.upiAccountId}
                placeholder="mydhobi@upi"
              />
              <label className="block space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-[#31405A]">
                  Payment QR Code
                </span>
                <div className="flex min-h-[64px] items-center gap-3 rounded border border-dashed border-[#C8D6E6] bg-[#F8FBFF] px-4 py-3 focus-within:border-[#075DFF] focus-within:ring-1 focus-within:ring-[#075DFF]/20">
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-blue-50 text-blue-700">
                    <ImageUp className="h-5 w-5" />
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="h-auto rounded-none border-0 bg-transparent p-0 shadow-none file:mr-4 file:rounded file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#071333]"
                  />
                </div>
              </label>
            </div>
          </SectionCard>

          <SectionCard
            number={5}
            title="Notifications & Notes"
          >
            <TextAreaField
              label="Notification Note Message"
              name="notificationNote"
              inputClassName="min-h-[58px]"
              defaultValue={store?.notificationNote}
              placeholder="Orders after 8 PM will be processed the next day."
            />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            number={2}
            title="Invoice & Processing"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <DurationField
                label="Process Time"
                name="processTime"
                defaultValue={store?.processTime}
                placeholder="24"
              />
              <DurationField
                label="Tag Delivery Date Interval"
                name="tagDeliveryDateInterval"
                defaultValue={store?.tagDeliveryDateInterval}
                placeholder="48"
              />
              <Field
                label="Name on Invoice"
                name="invoiceGenName"
                required
                value={invoiceName}
                onChange={(event) => {
                  invoiceNameEdited.current = true;
                  setInvoiceName(event.target.value);
                }}
                placeholder="Store name"
              />
              <Field
                label="Starting Invoice Number"
                name="invoiceGenNumber"
                required
                value={invoiceNumber}
                onChange={(event) => {
                  invoiceNumberEdited.current = true;
                  setInvoiceNumber(event.target.value);
                }}
                placeholder="MYD-IND-001"
              />
            </div>
          </SectionCard>

          <SectionCard
            number={4}
            title="Address Details"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field
                label="Address Line1"
                name="addressLine1"
                required
                className="md:col-span-2"
                defaultValue={store?.addressLine1}
                placeholder="12, 100 Feet Road"
              />
              <Field
                label="Address Line2"
                name="addressLine2"
                defaultValue={store?.addressLine2}
                placeholder="Near Metro Station"
              />
              {isEdit ? (
                <>
                  <Field
                    label="City"
                    name="city"
                    defaultValue={store?.city}
                    placeholder="Bengaluru"
                  />
                  <Field
                    label="State"
                    name="state"
                    required
                    defaultValue={store?.state}
                    placeholder="Karnataka"
                  />
                </>
              ) : (
                <>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#31405A]">
                      State <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="hidden"
                      name="state"
                      value={selectedLocationState?.name ?? ""}
                    />
                    <select
                      value={selectedLocationStateId}
                      onChange={(event) =>
                        handleLocationStateChange(event.target.value)
                      }
                      required
                      disabled={locationStates.length === 0}
                      className="h-[36px] w-full rounded border border-[#DCE6F2] bg-white px-3 text-sm font-normal text-[#071333] outline-none transition-colors focus:border-[#075DFF] focus:ring-1 focus:ring-[#075DFF]/20 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {locationStates.length === 0
                          ? "No active states"
                          : "Select state"}
                      </option>
                      {locationStates.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#31405A]">
                      City <span className="text-red-500">*</span>
                    </span>
                    <select
                      name="city"
                      value={selectedLocationCity}
                      onChange={(event) =>
                        setSelectedLocationCity(event.target.value)
                      }
                      required
                      disabled={
                        !selectedLocationStateId ||
                        availableLocationCities.length === 0
                      }
                      className="h-[36px] w-full rounded border border-[#DCE6F2] bg-white px-3 text-sm font-normal text-[#071333] outline-none transition-colors focus:border-[#075DFF] focus:ring-1 focus:ring-[#075DFF]/20 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {!selectedLocationStateId
                          ? "Select state first"
                          : availableLocationCities.length === 0
                            ? "No active cities"
                            : "Select city"}
                      </option>
                      {availableLocationCities.map((city) => (
                        <option key={city.id} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              <Field
                label="LandMark"
                name="landmark"
                defaultValue={store?.landmark}
                placeholder="Opposite City Mall"
              />
              <Field
                label="Pin Code"
                name="pinCode"
                type="number"
                defaultValue={store?.pinCode}
                placeholder="560001"
              />
              <Field
                label="Latitude"
                name="latitude"
                defaultValue={store?.latitude}
                placeholder="12.9716"
              />
              <Field
                label="Longitude"
                name="longitude"
                defaultValue={store?.longitude}
                placeholder="77.5946"
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-[34px] w-full rounded border-[#DCE6F2] bg-white text-xs font-medium text-[#075DFF]"
                  onClick={handleCurrentLocation}
                >
                  <Crosshair className="h-4 w-4" />
                  Current Location
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </form>
  );
}
