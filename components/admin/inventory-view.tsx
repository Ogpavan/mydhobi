"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Eye,
  IndianRupee,
  MapPin,
  MoreHorizontal,
  PackagePlus,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import type { InventoryItem } from "@/lib/inventory";
import type {
  SetupInventoryCategory,
  SetupInventoryUnit,
} from "@/lib/inventory-setup";
import { cn } from "@/lib/utils";

const selectClassName =
  "flex h-9 w-full rounded border border-input bg-white px-3 text-sm font-normal shadow-sm focus:border-[#075DFF] focus:outline-none focus:ring-1 focus:ring-[#075DFF]/20 disabled:cursor-not-allowed disabled:opacity-50";
const textareaClassName =
  "flex min-h-[74px] w-full resize-y rounded border border-input bg-white px-3 py-2 text-sm font-normal shadow-sm placeholder:text-slate-400 focus:border-[#075DFF] focus:outline-none focus:ring-1 focus:ring-[#075DFF]/20 disabled:cursor-not-allowed disabled:opacity-50";

type ApiResult = { item?: InventoryItem; message?: string };
type DrawerMode = "add" | "view" | "edit" | null;

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
      <div className="mt-1 break-words text-sm font-normal text-[#071333]">{value || "Not set"}</div>
    </div>
  );
}

function NumberInput({
  name,
  required,
  step = "0.001",
  max,
  defaultValue,
}: {
  name: string;
  required?: boolean;
  step?: string;
  max?: string;
  defaultValue?: number | null;
}) {
  return (
    <Input
      name={name}
      type="number"
      inputMode="decimal"
      min="0"
      max={max}
      step={step}
      required={required}
      defaultValue={defaultValue ?? undefined}
    />
  );
}

function formatStock(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function InventoryView({
  initialItems,
  categories,
  units,
}: {
  initialItems: InventoryItem[];
  categories: SetupInventoryCategory[];
  units: SetupInventoryUnit[];
}) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [unitTypeName, setUnitTypeName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      [item.name, item.sku, item.category, item.brand, item.supplier, item.warehouse]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [items, search]);

  function handleOpenChange(nextOpen: boolean) {
    if (saving) return;
    if (!nextOpen) {
      setDrawerMode(null);
      setSelectedItem(null);
      setHasExpiry(false);
      setCategoryName("");
      setUnitTypeName("");
      setFormError("");
    }
  }

  function openAddItem() {
    setSelectedItem(null);
    setHasExpiry(false);
    setCategoryName("");
    setUnitTypeName("");
    setFormError("");
    setDrawerMode("add");
  }

  function openItem(mode: "view" | "edit", item: InventoryItem) {
    setSelectedItem(item);
    setHasExpiry(item.hasExpiry);
    setCategoryName(item.category);
    setUnitTypeName(item.unitType);
    setFormError("");
    setDrawerMode(mode);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    values.hasExpiry = hasExpiry ? "yes" : "no";

    setSaving(true);
    setFormError("");
    try {
      const editing = drawerMode === "edit" && selectedItem;
      const response = await fetch(editing ? `/api/inventory/${selectedItem.id}` : "/api/inventory", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          status: String(values.status ?? (editing ? selectedItem.status : "active")),
        }),
      });
      const data = await response.json() as ApiResult;
      if (!response.ok || !data.item) {
        setFormError(data.message ?? (editing ? "Unable to update item." : "Unable to add item."));
        return;
      }

      const savedItem = data.item;
      setItems((current) => editing
        ? current.map((item) => item.id === savedItem.id ? savedItem : item)
        : [savedItem, ...current]);
      form.reset();
      setHasExpiry(false);
      setCategoryName("");
      setUnitTypeName("");
      setDrawerMode(null);
      setSelectedItem(null);
      toast.success(editing ? "Item updated" : "Item added");
    } catch {
      setFormError(
        drawerMode === "edit"
          ? "Unable to update item right now."
          : "Unable to add item right now.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item: InventoryItem) {
    setUpdatingStatusId(item.id);
    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: item.status === "active" ? "inactive" : "active" }),
      });
      const data = await response.json() as ApiResult;
      if (!response.ok || !data.item) {
        toast.error(data.message ?? "Unable to change item status.");
        return;
      }
      const savedItem = data.item;
      setItems((current) => current.map((entry) => entry.id === savedItem.id ? savedItem : entry));
      toast.success(savedItem.status === "active" ? "Item active" : "Item inactive");
    } catch {
      toast.error("Unable to change item status right now.");
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function deleteItem(item: InventoryItem) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    setDeletingId(item.id);
    try {
      const response = await fetch(`/api/inventory/${item.id}`, { method: "DELETE" });
      const data = await response.json() as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "Unable to delete item.");
        return;
      }
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      toast.success("Item deleted");
    } catch {
      toast.error("Unable to delete item right now.");
    } finally {
      setDeletingId(null);
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
            placeholder="Search inventory"
            aria-label="Search inventory"
          />
        </div>
        <Button
          onClick={openAddItem}
          className="shrink-0 bg-[#075DFF] shadow-[0_8px_18px_rgba(7,93,255,0.22)] hover:bg-[#064FEB]"
        >
          <PackagePlus />
          Add Item
        </Button>
      </CardHeader>

      <CardContent className="px-0 pb-2">
        <Table className="min-w-[1180px]">
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Purchase</TableHead>
              <TableHead>Storage</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[72px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center font-normal text-slate-500">
                  {items.length === 0 ? "No inventory items added." : "No items found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const lowStock = item.currentStock <= item.minimumStock;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[#071333]">{item.name}</p>
                        <p className="mt-1 text-xs font-normal text-[#52627A]">{item.sku}{item.brand ? ` · ${item.brand}` : ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-normal text-[#31405A]">{item.category}</p>
                      <p className="mt-1 text-xs text-[#52627A]">{item.unitType}{item.packSize ? ` · ${item.packSize}` : ""}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-[#071333]">{formatStock(item.currentStock)} {item.unitType}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[#52627A]">
                        Min: {formatStock(item.minimumStock)}
                        {lowStock ? <Badge className="border-red-200 bg-red-50 text-red-700" variant="outline">Low</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="flex items-center gap-1 font-normal text-[#31405A]"><IndianRupee className="h-3.5 w-3.5 text-slate-400" />{formatMoney(item.purchasePrice)}</p>
                      <p className="mt-1 text-xs text-[#52627A]">{item.supplier || "No supplier"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="flex items-center gap-1.5 font-normal text-[#31405A]"><MapPin className="h-3.5 w-3.5 text-slate-400" />{item.warehouse || "Not set"}</p>
                      <p className="mt-1 text-xs text-[#52627A]">{[item.rackNumber, item.shelf, item.bin].filter(Boolean).join(" · ") || "No location"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-normal text-[#31405A]">{item.hasExpiry ? item.expiryDate || "Date not set" : "No expiry"}</p>
                      {item.batchNumber ? <p className="mt-1 text-xs text-[#52627A]">Batch {item.batchNumber}</p> : null}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.status === "active"}
                        disabled={updatingStatusId === item.id}
                        onCheckedChange={() => void toggleStatus(item)}
                        aria-label={`Mark ${item.name} ${item.status === "active" ? "inactive" : "active"}`}
                        title={`Mark ${item.status === "active" ? "inactive" : "active"}`}
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
                            aria-label={`Open actions for ${item.name}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-32">
                          <DropdownMenuItem className="gap-2" onSelect={() => openItem("view", item)}>
                            <Eye /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onSelect={() => openItem("edit", item)}>
                            <Pencil /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={deletingId === item.id}
                            className="gap-2 text-red-600 focus:text-red-700"
                            onSelect={(event) => {
                              event.preventDefault();
                              void deleteItem(item);
                            }}
                          >
                            <Trash2 />
                            {deletingId === item.id ? "Deleting..." : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Sheet open={drawerMode !== null} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:w-[700px] sm:max-w-[700px]">
          <SheetHeader className="border-b border-[#DCE6F2] px-5 py-4 pr-14 text-left">
            <SheetTitle>
              {drawerMode === "view"
                ? "Item Details"
                : drawerMode === "edit"
                  ? "Edit Inventory Item"
                  : "Add Inventory Item"}
            </SheetTitle>
          </SheetHeader>
          {drawerMode === "view" && selectedItem ? (
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
              <Section title="Basic Information">
                <DetailItem label="Item Name" value={selectedItem.name} />
                <DetailItem label="SKU" value={selectedItem.sku} />
                <DetailItem label="Category" value={selectedItem.category} />
                <DetailItem label="Brand" value={selectedItem.brand} />
                <DetailItem label="Description" value={selectedItem.description} />
              </Section>
              <Section title="Unit Information">
                <DetailItem label="Unit Type" value={selectedItem.unitType} />
                <DetailItem label="Pack Size" value={selectedItem.packSize} />
              </Section>
              <Section title="Stock Details">
                <DetailItem label="Opening Stock" value={formatStock(selectedItem.openingStock)} />
                <DetailItem label="Current Stock" value={formatStock(selectedItem.currentStock)} />
                <DetailItem label="Minimum Stock Level" value={formatStock(selectedItem.minimumStock)} />
                <DetailItem label="Maximum Stock Level" value={selectedItem.maximumStock === null ? null : formatStock(selectedItem.maximumStock)} />
                <DetailItem label="Reorder Quantity" value={selectedItem.reorderQuantity === null ? null : formatStock(selectedItem.reorderQuantity)} />
              </Section>
              <Section title="Purchase Details">
                <DetailItem label="Supplier" value={selectedItem.supplier} />
                <DetailItem label="Purchase Price" value={`₹${formatMoney(selectedItem.purchasePrice)}`} />
                <DetailItem label="Selling Price" value={selectedItem.sellingPrice === null ? null : `₹${formatMoney(selectedItem.sellingPrice)}`} />
                <DetailItem label="Tax (%)" value={selectedItem.taxPercent === null ? null : selectedItem.taxPercent} />
                <DetailItem label="Last Purchase Date" value={selectedItem.lastPurchaseDate} />
              </Section>
              <Section title="Storage">
                <DetailItem label="Warehouse" value={selectedItem.warehouse} />
                <DetailItem label="Rack Number" value={selectedItem.rackNumber} />
                <DetailItem label="Shelf" value={selectedItem.shelf} />
                <DetailItem label="Bin" value={selectedItem.bin} />
              </Section>
              <Section title="Expiry">
                <DetailItem label="Has Expiry" value={selectedItem.hasExpiry ? "Yes" : "No"} />
                <DetailItem label="Manufacturing Date" value={selectedItem.manufacturingDate} />
                <DetailItem label="Expiry Date" value={selectedItem.expiryDate} />
                <DetailItem label="Batch Number" value={selectedItem.batchNumber} />
              </Section>
              <Section title="Status">
                <DetailItem label="Active/Inactive" value={<span className="capitalize">{selectedItem.status}</span>} />
              </Section>
              <Section title="Notes">
                <DetailItem label="Internal Notes" value={selectedItem.internalNotes} />
              </Section>
            </div>
          ) : drawerMode === "add" || (drawerMode === "edit" && selectedItem) ? (
          <form
            key={`${drawerMode}-${selectedItem?.id ?? "new"}`}
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
              <Section title="Basic Information">
                <Field label="Item Name" required>
                  <Input name="name" maxLength={150} defaultValue={selectedItem?.name} required />
                </Field>
                <Field label="SKU (Auto-generated)">
                  <Input value={selectedItem?.sku ?? "Generated after saving"} disabled readOnly />
                </Field>
                <Field label="Category" required>
                  <select
                    name="category"
                    className={selectClassName}
                    value={categoryName}
                    onChange={(event) => {
                      const category = categories.find((item) => item.name === event.target.value);
                      setCategoryName(event.target.value);
                      setUnitTypeName(category?.unitTypeName ?? "");
                    }}
                    required
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Brand">
                  <Input name="brand" maxLength={100} defaultValue={selectedItem?.brand} />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  <textarea name="description" className={textareaClassName} maxLength={1000} defaultValue={selectedItem?.description} />
                </Field>
              </Section>

              <Section title="Unit Information">
                <Field label="Unit Type" required>
                  <input type="hidden" name="unitType" value={unitTypeName} />
                  <select className={selectClassName} value={unitTypeName} disabled required>
                    <option value="" disabled>Select unit</option>
                    {units.map((unit) => <option key={unit.id} value={unit.name}>{unit.name}</option>)}
                  </select>
                </Field>
                <Field label="Pack Size">
                  <Input name="packSize" maxLength={50} placeholder="e.g. 5L, 25kg, 100 pcs" defaultValue={selectedItem?.packSize} />
                </Field>
              </Section>

              <Section title="Stock Details">
                <Field label="Opening Stock" required><NumberInput name="openingStock" defaultValue={selectedItem?.openingStock} required /></Field>
                <Field label="Current Stock (auto after creation)"><Input value={selectedItem ? formatStock(selectedItem.currentStock) : "Same as opening stock"} disabled readOnly /></Field>
                <Field label="Minimum Stock Level" required><NumberInput name="minimumStock" defaultValue={selectedItem?.minimumStock} required /></Field>
                <Field label="Maximum Stock Level"><NumberInput name="maximumStock" defaultValue={selectedItem?.maximumStock} /></Field>
                <Field label="Reorder Quantity"><NumberInput name="reorderQuantity" defaultValue={selectedItem?.reorderQuantity} /></Field>
              </Section>

              <Section title="Purchase Details">
                <Field label="Supplier"><Input name="supplier" maxLength={150} defaultValue={selectedItem?.supplier} /></Field>
                <Field label="Purchase Price" required><NumberInput name="purchasePrice" step="0.01" defaultValue={selectedItem?.purchasePrice} required /></Field>
                <Field label="Selling Price (optional)"><NumberInput name="sellingPrice" step="0.01" defaultValue={selectedItem?.sellingPrice} /></Field>
                <Field label="Tax (%)"><NumberInput name="taxPercent" step="0.01" max="100" defaultValue={selectedItem?.taxPercent} /></Field>
                <Field label="Last Purchase Date"><Input name="lastPurchaseDate" type="date" defaultValue={selectedItem?.lastPurchaseDate} /></Field>
              </Section>

              <Section title="Storage">
                <Field label="Warehouse"><Input name="warehouse" maxLength={100} placeholder="e.g. Warehouse A" defaultValue={selectedItem?.warehouse} /></Field>
                <Field label="Rack Number"><Input name="rackNumber" maxLength={50} placeholder="e.g. Rack R3" defaultValue={selectedItem?.rackNumber} /></Field>
                <Field label="Shelf"><Input name="shelf" maxLength={50} placeholder="e.g. Shelf 2" defaultValue={selectedItem?.shelf} /></Field>
                <Field label="Bin"><Input name="bin" maxLength={50} placeholder="e.g. Bin 15" defaultValue={selectedItem?.bin} /></Field>
              </Section>

              <Section title="Expiry (Optional)">
                <div className="flex h-9 items-center gap-3 sm:col-span-2">
                  <Switch checked={hasExpiry} onCheckedChange={setHasExpiry} aria-label="Has expiry" />
                  <span className="text-[13px] font-medium text-[#31405A]">Has Expiry</span>
                </div>
                <Field label="Manufacturing Date"><Input name="manufacturingDate" type="date" defaultValue={selectedItem?.manufacturingDate} disabled={!hasExpiry} /></Field>
                <Field label="Expiry Date"><Input name="expiryDate" type="date" defaultValue={selectedItem?.expiryDate} disabled={!hasExpiry} /></Field>
                <Field label="Batch Number"><Input name="batchNumber" maxLength={100} defaultValue={selectedItem?.batchNumber} disabled={!hasExpiry} /></Field>
              </Section>

              <Section title="Status">
                <Field label="Active/Inactive">
                  <select name="status" className={selectClassName} defaultValue={selectedItem?.status ?? "active"}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Field>
              </Section>

              <Section title="Notes">
                <Field label="Internal Notes" className="sm:col-span-2">
                  <textarea name="internalNotes" className={textareaClassName} maxLength={1000} defaultValue={selectedItem?.internalNotes} />
                </Field>
              </Section>
            </div>

            <SheetFooter className="grid grid-cols-2 gap-2 border-t border-[#DCE6F2] bg-white px-5 py-3 sm:flex sm:gap-0">
              <div className="col-span-2 flex min-h-4 flex-1 items-center text-left text-xs font-normal text-red-600 sm:min-h-5" role="alert">
                {formError}
              </div>
              <Button type="button" variant="outline" disabled={saving} onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : drawerMode === "edit" ? "Save Item" : "Add Item"}
              </Button>
            </SheetFooter>
          </form>
          ) : null}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
