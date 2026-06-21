"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { ArrowLeft, Crosshair, ImageUp, Info, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Store, StorePayload, StoreStatus } from "@/lib/stores";

type StoreFormProps = {
  mode: "create" | "edit";
  store?: Store;
};

type FieldProps = {
  label: string;
  name: keyof StorePayload;
  required?: boolean;
  type?: string;
  className?: string;
  defaultValue?: string;
  placeholder?: string;
};

function Field({
  label,
  name,
  required = false,
  type = "text",
  className,
  defaultValue,
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
        placeholder={placeholder}
        required={required}
        className="h-[36px] rounded border-[#DCE6F2] text-sm font-normal shadow-none focus-visible:border-[#075DFF] focus-visible:ring-1 focus-visible:ring-[#075DFF]/20"
      />
    </label>
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
  description,
  children,
  className,
}: {
  number: number;
  title: string;
  description: string;
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
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium leading-none text-[#071333]">
                {title}
              </h2>
              <Info className="h-3.5 w-3.5 text-[#8EA0B8]" />
            </div>
            <p className="mt-1 text-xs font-normal leading-none text-[#52627A]">
              {description}
            </p>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function getFormValue(formData: FormData, name: keyof StorePayload) {
  return String(formData.get(name) ?? "");
}

function getStorePayload(formData: FormData): StorePayload {
  const status = getFormValue(formData, "status");

  return {
    name: getFormValue(formData, "name"),
    company: getFormValue(formData, "company"),
    email: getFormValue(formData, "email"),
    mobile: getFormValue(formData, "mobile"),
    processTime: getFormValue(formData, "processTime"),
    tagDeliveryDateInterval: getFormValue(formData, "tagDeliveryDateInterval"),
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

export function StoreForm({ mode, store }: StoreFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = mode === "edit";

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
            disabled={isSubmitting}
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
            description="Essential information about the store."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Store Name"
                name="name"
                required
                defaultValue={store?.name}
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
                defaultValue={store?.mobile}
                placeholder="+91 98765 43210"
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
            description="UPI account information for receiving payments."
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
              <TextAreaField
                label="Disclaimer For Upi Id Storage & Liability"
                name="upiDisclaimer"
                className="md:col-span-2"
                inputClassName="min-h-[90px]"
                defaultValue={store?.upiDisclaimer}
                placeholder="Payments made to this UPI ID are subject to store verification."
              />
            </div>
          </SectionCard>

          <SectionCard
            number={5}
            title="Notifications & Notes"
            description="Add notes or special instructions for this store."
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
            description="Configure invoice generation and processing preferences."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Process Time"
                name="processTime"
                defaultValue={store?.processTime}
                placeholder="24 hrs"
              />
              <Field
                label="Tag Delivery Date Interval"
                name="tagDeliveryDateInterval"
                defaultValue={store?.tagDeliveryDateInterval}
                placeholder="2 days"
              />
              <Field
                label="Invoice Gen Name"
                name="invoiceGenName"
                required
                defaultValue={store?.invoiceGenName}
                placeholder="MyDhobi Indiranagar"
              />
              <Field
                label="Invoice Gen Number"
                name="invoiceGenNumber"
                required
                defaultValue={store?.invoiceGenNumber}
                placeholder="INV-001"
              />
              <label className="block space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-[#31405A]">
                  Upload Your Payment QrCode Image Below
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
            number={4}
            title="Address Details"
            description="Store location and address information."
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
