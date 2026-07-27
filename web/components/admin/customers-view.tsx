"use client";

import type { FormEvent, InputHTMLAttributes, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  CircleMinus,
  CirclePlus,
  Eye,
  Loader2,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Customer } from "@/lib/customers";
import type {
  AdminCustomerWallet,
} from "@/lib/admin-customer-wallet";
import { cn } from "@/lib/utils";

const selectClassName =
  "flex h-9 w-full rounded border border-input bg-white px-3 text-sm font-normal shadow-sm focus:border-[#075DFF] focus:outline-none focus:ring-1 focus:ring-[#075DFF]/20 disabled:cursor-not-allowed disabled:opacity-50";
const textareaClassName =
  "flex min-h-[72px] w-full resize-y rounded border border-input bg-white px-3 py-2 text-sm font-normal shadow-sm placeholder:text-slate-400 focus:border-[#075DFF] focus:outline-none focus:ring-1 focus:ring-[#075DFF]/20 disabled:cursor-not-allowed disabled:opacity-50";

type ApiResult = { customer?: Customer; message?: string };
type DrawerMode = "add" | "view" | "edit" | null;
type WalletAction = "add" | "deduct";

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-1.5 text-[13px] font-medium text-[#31405A]", className)}>
      <span>
        {label}{required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function DigitsInput({ maxLength, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      {...props}
      maxLength={maxLength}
      inputMode="numeric"
      onInput={(event) => {
        event.currentTarget.value = event.currentTarget.value
          .replace(/\D/g, "")
          .slice(0, maxLength);
      }}
    />
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-3 border-0 p-0">
      <legend className="mb-3 w-full border-b border-[#E5EDF6] pb-2 text-sm font-medium text-[#071333]">
        {title}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#718198]">{label}</p>
      <div className="mt-1 break-words text-sm font-normal text-[#071333]">
        {value || "Not set"}
      </div>
    </div>
  );
}

export function CustomersView({
  initialCustomers,
  canManageWallet,
}: {
  initialCustomers: Customer[];
  canManageWallet: boolean;
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [walletCustomer, setWalletCustomer] = useState<Customer | null>(null);
  const [wallet, setWallet] = useState<AdminCustomerWallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletLoadError, setWalletLoadError] = useState("");
  const [walletAction, setWalletAction] = useState<WalletAction>("add");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletReason, setWalletReason] = useState("");
  const [walletSaving, setWalletSaving] = useState(false);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      [
        customer.fullName,
        customer.mobile,
        customer.whatsapp,
        customer.city,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [customers, search]);

  function handleOpenChange(nextOpen: boolean) {
    if (saving) return;
    if (!nextOpen) {
      setDrawerMode(null);
      setSelectedCustomer(null);
      setFormError("");
    }
  }

  function openAddCustomer() {
    setSelectedCustomer(null);
    setFormError("");
    setDrawerMode("add");
  }

  function openCustomer(mode: "view" | "edit", customer: Customer) {
    setSelectedCustomer(customer);
    setFormError("");
    setDrawerMode(mode);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const mobile = String(values.mobile ?? "");
    const whatsapp = String(values.whatsapp ?? "");
    const pincode = String(values.pincode ?? "");
    const password = String(values.password ?? "");

    if (!/^\d{10}$/.test(mobile)) {
      setFormError("Enter a 10-digit mobile number.");
      return;
    }
    if (whatsapp && !/^\d{10}$/.test(whatsapp)) {
      setFormError("Enter a 10-digit WhatsApp number.");
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      setFormError("Enter a 6-digit pincode.");
      return;
    }
    if (password && (password.length < 8 || password.length > 72)) {
      setFormError("Password must be 8 to 72 characters.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const editing = drawerMode === "edit" && selectedCustomer;
      const response = await fetch(
        editing ? `/api/customers/${selectedCustomer.id}` : "/api/customers",
        {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          status: editing ? selectedCustomer.status : "active",
        }),
      });
      const data = await response.json() as ApiResult;
      if (!response.ok || !data.customer) {
        setFormError(data.message ?? "Unable to add customer.");
        return;
      }

      const savedCustomer = data.customer;
      setCustomers((current) => editing
        ? current.map((customer) => customer.id === savedCustomer.id ? savedCustomer : customer)
        : [savedCustomer, ...current]);
      form.reset();
      setDrawerMode(null);
      setSelectedCustomer(null);
      toast.success(editing ? "Customer updated" : "Customer added");
    } catch {
      setFormError(
        drawerMode === "edit"
          ? "Unable to update customer right now."
          : "Unable to add customer right now.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(customer: Customer) {
    setUpdatingStatusId(customer.id);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: customer.status === "active" ? "inactive" : "active",
        }),
      });
      const data = await response.json() as ApiResult;
      if (!response.ok || !data.customer) {
        toast.error(data.message ?? "Unable to change customer status.");
        return;
      }
      const savedCustomer = data.customer;
      setCustomers((current) => current.map((item) =>
        item.id === savedCustomer.id ? savedCustomer : item));
      toast.success(savedCustomer.status === "active" ? "Customer active" : "Customer inactive");
    } catch {
      toast.error("Unable to change customer status right now.");
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function deleteSelectedCustomer(customer: Customer) {
    if (!window.confirm(`Delete ${customer.fullName}?`)) return;
    setDeletingId(customer.id);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
      });
      const data = await response.json() as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "Unable to delete customer.");
        return;
      }
      setCustomers((current) => current.filter((item) => item.id !== customer.id));
      toast.success("Customer deleted");
    } catch {
      toast.error("Unable to delete customer right now.");
    } finally {
      setDeletingId(null);
    }
  }

  async function openWallet(customer: Customer) {
    setWalletCustomer(customer);
    setWallet(null);
    setWalletLoadError("");
    setWalletAction("add");
    setWalletAmount("");
    setWalletReason("");
    setWalletLoading(true);

    try {
      const response = await fetch(`/api/customers/${customer.id}/wallet`);
      const data = await response.json() as {
        wallet?: AdminCustomerWallet;
        message?: string;
      };
      if (!response.ok || !data.wallet) {
        setWalletLoadError(data.message ?? "Unable to load wallet.");
        return;
      }
      setWallet(data.wallet);
    } catch {
      setWalletLoadError("Unable to load wallet right now.");
    } finally {
      setWalletLoading(false);
    }
  }

  function closeWallet(nextOpen: boolean) {
    if (nextOpen || walletSaving) return;
    setWalletCustomer(null);
    setWallet(null);
    setWalletLoadError("");
  }

  async function submitWalletAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!walletCustomer) return;

    const amount = Number(walletAmount);
    if (!Number.isFinite(amount) || amount < 1 || amount > 50000) {
      toast.error("Enter an amount from ₹1 to ₹50,000.");
      return;
    }
    if (walletAction === "deduct" && wallet && amount > wallet.balance) {
      toast.error("Wallet balance is too low.");
      return;
    }
    if (walletReason.trim().length < 3) {
      toast.error("Enter a short reason.");
      return;
    }

    setWalletSaving(true);
    try {
      const response = await fetch(`/api/customers/${walletCustomer.id}/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: walletAction,
          amount,
          reason: walletReason,
        }),
      });
      const data = await response.json() as {
        wallet?: AdminCustomerWallet;
        message?: string;
      };
      if (!response.ok || !data.wallet) {
        toast.error(data.message ?? "Unable to update wallet.");
        return;
      }

      setWallet(data.wallet);
      setCustomers((current) => current.map((customer) =>
        customer.id === walletCustomer.id
          ? { ...customer, walletBalance: data.wallet!.balance }
          : customer));
      setWalletAmount("");
      setWalletReason("");
      toast.success(walletAction === "add" ? "Money added" : "Money deducted");
    } catch {
      toast.error("Unable to update wallet right now.");
    } finally {
      setWalletSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 p-4">
        <div className="relative w-full max-w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52627A]" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            placeholder="Search customers"
            aria-label="Search customers"
          />
        </div>

        <Button
          onClick={openAddCustomer}
          className="shrink-0 bg-[#075DFF] shadow-[0_8px_18px_rgba(7,93,255,0.22)] hover:bg-[#064FEB]"
        >
          <Plus />
          Add Customer
        </Button>

        <Sheet open={drawerMode !== null} onOpenChange={handleOpenChange}>
          <SheetContent
            side="right"
            className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-[680px] sm:w-[680px]"
          >
            <SheetHeader className="border-b border-[#DCE6F2] px-5 py-4 pr-14 text-left">
              <SheetTitle>
                {drawerMode === "view"
                  ? "Customer Details"
                  : drawerMode === "edit"
                    ? "Edit Customer"
                    : "Add Customer"}
              </SheetTitle>
            </SheetHeader>

            {drawerMode === "view" && selectedCustomer ? (
              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
                <Section title="Customer Information">
                  <DetailItem label="Full Name" value={selectedCustomer.fullName} />
                  <DetailItem label="Mobile Number" value={selectedCustomer.mobile} />
                  <DetailItem label="WhatsApp Number" value={selectedCustomer.whatsapp} />
                  <DetailItem
                    label="Customer Type"
                    value={<span className="capitalize">{selectedCustomer.customerType}</span>}
                  />
                  <DetailItem
                    label="Login Access"
                    value={selectedCustomer.hasLogin ? "Enabled" : "Not enabled"}
                  />
                </Section>
                <Section title="Address">
                  <DetailItem label="House/Flat No." value={selectedCustomer.houseFlatNo} />
                  <DetailItem label="Street/Area" value={selectedCustomer.streetArea} />
                  <DetailItem label="Landmark" value={selectedCustomer.landmark} />
                  <DetailItem label="City" value={selectedCustomer.city} />
                  <DetailItem label="Pincode" value={selectedCustomer.pincode} />
                  <DetailItem
                    label="Google Maps Pin"
                    value={selectedCustomer.googleMapsPin ? (
                      <a
                        href={selectedCustomer.googleMapsPin}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#075DFF] hover:underline"
                      >
                        Open map
                      </a>
                    ) : null}
                  />
                </Section>
                <Section title="Notes">
                  <DetailItem label="Pickup Instructions" value={selectedCustomer.pickupInstructions} />
                  <DetailItem label="Internal Notes" value={selectedCustomer.internalNotes} />
                </Section>
                <Section title="Status">
                  <DetailItem
                    label="Active/Inactive"
                    value={<span className="capitalize">{selectedCustomer.status}</span>}
                  />
                </Section>
              </div>
            ) : drawerMode === "add" || (drawerMode === "edit" && selectedCustomer) ? (
            <form
              key={`${drawerMode}-${selectedCustomer?.id ?? "new"}`}
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
                <Section title="Customer Information">
                  <Field label="Full Name" required>
                    <Input name="fullName" autoComplete="name" maxLength={150} defaultValue={selectedCustomer?.fullName} required />
                  </Field>
                  <Field label="Mobile Number" required>
                    <DigitsInput
                      name="mobile"
                      autoComplete="tel"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      title="Enter a 10-digit mobile number."
                      defaultValue={selectedCustomer?.mobile}
                      required
                    />
                  </Field>
                  <Field label="WhatsApp Number">
                    <DigitsInput
                      name="whatsapp"
                      autoComplete="tel"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      title="Enter a 10-digit WhatsApp number."
                      defaultValue={selectedCustomer?.whatsapp}
                    />
                  </Field>
                  <Field label="Customer Type" required>
                    <select name="customerType" className={selectClassName} defaultValue={selectedCustomer?.customerType ?? "individual"} required>
                      <option value="individual">Individual</option>
                      <option value="business">Business</option>
                    </select>
                  </Field>
                  <Field
                    label={drawerMode === "edit" ? "New Login Password" : "Login Password"}
                    className="sm:col-span-2"
                  >
                    <Input
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={72}
                    />
                  </Field>
                </Section>

                <Section title="Address">
                  <Field label="House/Flat No." required>
                    <Input name="houseFlatNo" autoComplete="address-line1" maxLength={100} defaultValue={selectedCustomer?.houseFlatNo} required />
                  </Field>
                  <Field label="Street/Area" required>
                    <Input name="streetArea" autoComplete="address-line2" maxLength={200} defaultValue={selectedCustomer?.streetArea} required />
                  </Field>
                  <Field label="Landmark">
                    <Input name="landmark" maxLength={150} defaultValue={selectedCustomer?.landmark} />
                  </Field>
                  <Field label="City" required>
                    <Input name="city" autoComplete="address-level2" maxLength={100} defaultValue={selectedCustomer?.city} required />
                  </Field>
                  <Field label="Pincode" required>
                    <DigitsInput
                      name="pincode"
                      autoComplete="postal-code"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      title="Enter a 6-digit pincode."
                      defaultValue={selectedCustomer?.pincode}
                      required
                    />
                  </Field>
                  <Field label="Google Maps Pin">
                    <Input name="googleMapsPin" type="url" placeholder="https://maps.google.com/..." defaultValue={selectedCustomer?.googleMapsPin} />
                  </Field>
                </Section>

                <Section title="Notes">
                  <Field label="Pickup Instructions" className="sm:col-span-2">
                    <textarea name="pickupInstructions" className={textareaClassName} maxLength={1000} defaultValue={selectedCustomer?.pickupInstructions} />
                  </Field>
                  <Field label="Internal Notes" className="sm:col-span-2">
                    <textarea name="internalNotes" className={textareaClassName} maxLength={1000} defaultValue={selectedCustomer?.internalNotes} />
                  </Field>
                </Section>
              </div>

              <SheetFooter className="grid grid-cols-2 gap-2 border-t border-[#DCE6F2] bg-white px-5 py-3 sm:flex sm:gap-0">
                <div className="col-span-2 flex min-h-4 flex-1 items-center text-left text-xs font-normal text-red-600 sm:min-h-5" role="alert">
                  {formError}
                </div>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : drawerMode === "edit"
                      ? "Save Customer"
                      : "Add Customer"}
                </Button>
              </SheetFooter>
            </form>
            ) : null}
          </SheetContent>
        </Sheet>
      </CardHeader>

      <CardContent className="px-0 pb-2">
        <Table className="min-w-[880px]">
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[72px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center font-normal text-slate-500">
                  {customers.length === 0 ? "No customers added." : "No customers found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-[#071333]">{customer.fullName}</p>
                      <p className="mt-1 text-xs font-normal capitalize text-[#52627A]">
                        {customer.customerType}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5 text-sm font-normal text-[#31405A]">
                      <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" />{customer.mobile}</p>
                      <p className="flex items-center gap-2 text-xs text-[#52627A]"><MessageCircle className="h-3.5 w-3.5 text-slate-400" />{customer.whatsapp || "Not set"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[250px] font-normal text-[#31405A]">
                      <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" /><span>{customer.houseFlatNo}, {customer.streetArea}</span></p>
                      <p className="mt-1 pl-[22px] text-xs text-[#52627A]">{customer.city} - {customer.pincode}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.hasLogin ? (
                      <span className="font-medium tabular-nums text-[#071333]">
                        ₹{customer.walletBalance.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-[#718198]">No login</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={customer.status === "active"}
                      disabled={updatingStatusId === customer.id}
                      onCheckedChange={() => void toggleStatus(customer)}
                      aria-label={`Mark ${customer.fullName} ${customer.status === "active" ? "inactive" : "active"}`}
                      title={`Mark ${customer.status === "active" ? "inactive" : "active"}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded text-slate-500 hover:text-slate-900"
                          aria-label={`Open actions for ${customer.fullName}`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-32">
                        <DropdownMenuItem
                          className="gap-2"
                          onSelect={() => openCustomer("view", customer)}
                        >
                          <Eye />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onSelect={() => openCustomer("edit", customer)}
                        >
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        {canManageWallet ? (
                          <DropdownMenuItem
                            className="gap-2"
                            disabled={!customer.hasLogin}
                            onSelect={() => void openWallet(customer)}
                          >
                            <WalletCards />
                            Wallet
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={deletingId === customer.id}
                          className="gap-2 text-red-600 focus:text-red-700"
                          onSelect={(event) => {
                            event.preventDefault();
                            void deleteSelectedCustomer(customer);
                          }}
                        >
                          <Trash2 />
                          {deletingId === customer.id ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={walletCustomer !== null} onOpenChange={closeWallet}>
        <DialogContent className="top-1/2 max-h-[88vh] max-w-[560px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Wallet</DialogTitle>
          </DialogHeader>

          {walletLoading ? (
            <div className="flex min-h-52 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#075DFF]" />
              <span className="sr-only">Loading wallet</span>
            </div>
          ) : walletLoadError ? (
            <div className="p-5">
              <p className="rounded bg-red-50 px-3 py-3 text-[13px] text-red-700">
                {walletLoadError}
              </p>
              {walletCustomer ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() => void openWallet(walletCustomer)}
                >
                  Try Again
                </Button>
              ) : null}
            </div>
          ) : wallet ? (
            <div>
              <div className="flex items-center justify-between gap-4 border-b border-[#E7EDF5] bg-[#F8FAFD] px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[#31405A]">
                    {wallet.customerName}
                  </p>
                  <p className="mt-1 text-[11px] text-[#718198]">Current balance</p>
                </div>
                <p className="shrink-0 text-[24px] font-semibold tabular-nums text-[#071333]">
                  ₹{wallet.balance.toFixed(2)}
                </p>
              </div>

              <form onSubmit={submitWalletAdjustment} className="space-y-4 px-5 py-4">
                <div
                  className="grid grid-cols-2 rounded border border-[#DCE6F2] bg-[#F8FAFD] p-1"
                  role="group"
                  aria-label="Wallet action"
                >
                  <button
                    type="button"
                    onClick={() => setWalletAction("add")}
                    className={cn(
                      "flex h-9 items-center justify-center gap-2 rounded text-[13px] font-medium",
                      walletAction === "add"
                        ? "bg-white text-green-700 shadow-sm"
                        : "text-[#52627A]",
                    )}
                  >
                    <CirclePlus className="h-4 w-4" />
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletAction("deduct")}
                    className={cn(
                      "flex h-9 items-center justify-center gap-2 rounded text-[13px] font-medium",
                      walletAction === "deduct"
                        ? "bg-white text-red-700 shadow-sm"
                        : "text-[#52627A]",
                    )}
                  >
                    <CircleMinus className="h-4 w-4" />
                    Deduct
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-[13px] font-medium text-[#31405A]">
                    <span>Amount</span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#52627A]">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="1"
                        max="50000"
                        step="0.01"
                        value={walletAmount}
                        onChange={(event) => setWalletAmount(event.target.value)}
                        className="pl-7"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </label>
                  <label className="grid gap-1.5 text-[13px] font-medium text-[#31405A]">
                    <span>Reason</span>
                    <Input
                      value={walletReason}
                      onChange={(event) => setWalletReason(event.target.value)}
                      minLength={3}
                      maxLength={200}
                      placeholder="Reason"
                      required
                    />
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={walletSaving}
                  className={cn(
                    "w-full",
                    walletAction === "deduct" &&
                      "bg-red-600 hover:bg-red-700",
                  )}
                >
                  {walletSaving ? (
                    <Loader2 className="animate-spin" />
                  ) : walletAction === "add" ? (
                    <CirclePlus />
                  ) : (
                    <CircleMinus />
                  )}
                  {walletSaving
                    ? "Saving..."
                    : walletAction === "add"
                      ? "Add Money"
                      : "Deduct Money"}
                </Button>
              </form>

            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
