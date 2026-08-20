"use client";

import { MoreHorizontal, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Store } from "@/lib/stores";
import type { ItemCategory, ItemDetail, ItemListRow, ItemMasterService, ItemServiceMapping, RateCardGroup, RateCardStoreAssignment, StoreRateOverride } from "@/lib/item-master-types";
import { PRICING_UNIT_LABELS, PRICING_UNITS } from "@/lib/item-master-types";

const inputClass = "h-9 rounded border-[#DCE6F2] text-[12px]";
const selectClass = "h-9 w-full rounded border border-[#DCE6F2] bg-white px-3 text-[12px] text-[#071333]";

function statusBadge(active: boolean) {
  return <Badge className={active ? "bg-[#E9F8EF] text-[#15803D]" : "bg-[#F1F3F6] text-[#64748B]"}>{active ? "Active" : "Inactive"}</Badge>;
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json() as T & { message?: string };
  if (!response.ok) throw new Error(data.message ?? "Something went wrong.");
  return data;
}

async function uploadCatalogImage(file: File) {
  const formData = new FormData();
  formData.set("image", file);
  const data = await requestJson<{ imagePath: string }>("/api/admin/service-catalog-images", {
    method: "POST",
    body: formData,
  });
  return data.imagePath;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-[12px] font-medium text-[#31405A]">{label}<span className="mt-1.5 block">{children}</span></label>;
}

type ActionOption = {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  confirm?: { title: string; message: string; confirmLabel?: string };
};

function ActionMenu({ actions }: { actions: ActionOption[] }) {
  const [pending, setPending] = useState<ActionOption | null>(null);
  function select(action: ActionOption) {
    if (action.confirm) setPending(action);
    else action.onSelect();
  }
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Open actions"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">{actions.map((action) => <DropdownMenuItem key={action.label} onSelect={() => select(action)} className={action.destructive ? "text-[#DC2626] focus:text-[#DC2626]" : ""}>{action.label}</DropdownMenuItem>)}</DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={Boolean(pending)} onOpenChange={(open) => { if (!open) setPending(null); }}>
      <DialogContent className="p-0"><DialogHeader><DialogTitle>{pending?.confirm?.title}</DialogTitle></DialogHeader><div className="space-y-4 p-4"><p className="text-[13px] leading-5 text-[#52627C]">{pending?.confirm?.message}</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setPending(null)}>Cancel</Button><Button variant="destructive" onClick={() => { pending?.onSelect(); setPending(null); }}>{pending?.confirm?.confirmLabel ?? "Confirm"}</Button></div></div></DialogContent>
    </Dialog>
  </>;
}

function ItemForm({ open, onOpenChange, item, categories, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; item: ItemListRow | null; categories: ItemCategory[]; onSaved: (item: ItemDetail) => void }) {
  const [saving, setSaving] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    try {
      const values = new FormData(event.currentTarget);
      const file = values.get("image");
      const imagePath = file instanceof File && file.size > 0 ? await uploadCatalogImage(file) : item?.imagePath ?? "";
      const body = { name: String(values.get("name") ?? ""), categoryId: Number(values.get("categoryId")), shortCode: String(values.get("shortCode") ?? ""), description: String(values.get("description") ?? ""), imagePath, defaultPricingUnit: values.get("defaultPricingUnit"), sortOrder: Number(values.get("sortOrder") ?? 0), isActive: values.get("isActive") === "on" };
      const data = await requestJson<{ item: ItemDetail }>(item ? `/api/admin/item-master/items/${item.id}` : "/api/admin/item-master/items", { method: item ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      onSaved(data.item); onOpenChange(false); toast.success(item ? "Item updated" : "Item created");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save item."); } finally { setSaving(false); }
  }
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="w-full overflow-y-auto sm:max-w-[480px]"><SheetHeader><SheetTitle>{item ? "Edit item" : "Add item"}</SheetTitle></SheetHeader><form onSubmit={save} className="mt-6 space-y-4">
    <div className="grid grid-cols-2 gap-3"><Field label="Item name"><Input name="name" required defaultValue={item?.name ?? ""} className={inputClass} /></Field><Field label="Short code"><Input name="shortCode" required defaultValue={item?.shortCode ?? ""} className={inputClass} /></Field></div>
    <Field label="Category"><select name="categoryId" required defaultValue={item?.categoryId ?? categories.find((category) => category.isActive)?.id ?? ""} className={selectClass}>{categories.filter((category) => category.isActive).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
    <Field label="Description"><textarea name="description" defaultValue={item?.description ?? ""} className="min-h-[80px] w-full rounded border border-[#DCE6F2] px-3 py-2 text-[12px] outline-none focus:border-[#075DFF]" /></Field>
    <Field label={item?.imagePath ? "Replace image or icon" : "Upload image or icon"}><Input name="image" type="file" accept="image/png,image/jpeg,image/webp" className="h-10 w-full rounded border border-dashed border-[#C8D6E6] bg-[#F8FBFF] px-3 py-2 text-[11px]" /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Default pricing unit"><select name="defaultPricingUnit" defaultValue={item?.defaultPricingUnit ?? "piece"} className={selectClass}>{PRICING_UNITS.map((unit) => <option key={unit} value={unit}>{PRICING_UNIT_LABELS[unit]}</option>)}</select></Field><Field label="Sort order"><Input name="sortOrder" type="number" min="0" defaultValue={item?.sortOrder ?? 0} className={inputClass} /></Field></div>
    <label className="flex items-center gap-2 text-[12px] font-medium text-[#31405A]"><input name="isActive" type="checkbox" defaultChecked={item?.isActive ?? true} /> Active</label>
    <SheetFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save item"}</Button></SheetFooter>
  </form></SheetContent></Sheet>;
}

function ItemDetailSheet({ open, onOpenChange, item, services, stores, onChanged }: { open: boolean; onOpenChange: (open: boolean) => void; item: ItemDetail | null; services: ItemMasterService[]; stores: Store[]; onChanged: () => void }) {
  const [tab, setTab] = useState<"overview" | "services" | "store" | "activity">("services");
  const [detail, setDetail] = useState<ItemDetail | null>(item);
  const [saving, setSaving] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<StoreRateOverride[]>([]);
  const [storeForm] = useState({ storeId: stores[0]?.id ?? "", mappingId: "" });

  async function load() { if (!item) return; const data = await requestJson<{ item: ItemDetail }>(`/api/admin/item-master/items/${item.id}`); setDetail(data.item); }
  async function saveMapping(service: ItemMasterService, mapping: ItemServiceMapping | undefined, form: HTMLFormElement) {
    void mapping;
    setSaving(service.id); try { const values = new FormData(form); await requestJson(`/api/admin/item-master/items/${item?.id}/services`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId: service.id, isEnabled: values.get("enabled") === "on", price: Number(values.get("price") ?? 0), pricingUnit: values.get("pricingUnit") ?? "piece", turnaroundHours: Number(values.get("turnaroundHours") ?? 0), expressAvailable: values.get("expressAvailable") === "on", expressPrice: values.get("expressPrice") === "" ? null : Number(values.get("expressPrice")), expressTurnaroundHours: values.get("expressTurnaroundHours") === "" ? null : Number(values.get("expressTurnaroundHours")) }) }); await load(); onChanged(); toast.success(`${service.name} pricing saved`); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save pricing."); } finally { setSaving(null); }
  }
  async function loadOverrides() { if (!item) return; const data = await requestJson<{ overrides: StoreRateOverride[] }>(`/api/admin/item-master/items/${item.id}/store-pricing`); setOverrides(data.overrides); }
  async function saveOverride(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!item) return; try { const values = new FormData(event.currentTarget); await requestJson(`/api/admin/item-master/items/${item.id}/store-pricing`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storeId: values.get("storeId"), mappingId: Number(values.get("mappingId")), price: Number(values.get("price")), turnaroundHours: values.get("turnaroundHours") || null, expressPrice: values.get("expressPrice") || null }) }); await loadOverrides(); toast.success("Store price saved"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save store price."); } }
  useEffect(() => { setDetail(item); }, [item]);
  const enabledMappings = detail?.mappings.filter((mapping): mapping is ItemServiceMapping & { id: number } => mapping.isEnabled && mapping.id !== null) ?? [];
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="w-full overflow-y-auto sm:max-w-[680px]"><SheetHeader><SheetTitle>{detail?.name ?? "Item details"}</SheetTitle></SheetHeader>
    <div className="mt-5 flex gap-1 border-b border-[#E5EBF3]">{([['overview', 'Overview'], ['services', 'Services & pricing'], ['store', 'Store pricing'], ['activity', 'Activity']] as const).map(([key, label]) => <button key={key} type="button" onClick={() => { setTab(key); if (key === "store") void loadOverrides(); }} className={`border-b-2 px-3 pb-2 text-[12px] font-medium ${tab === key ? "border-[#075DFF] text-[#075DFF]" : "border-transparent text-[#71809A]"}`}>{label}</button>)}</div>
    {tab === "overview" && detail && <div className="mt-5 grid grid-cols-2 gap-3 text-[12px]"><Info label="Category" value={detail.categoryName} /><Info label="Short code" value={detail.shortCode} /><Info label="Pricing unit" value={PRICING_UNIT_LABELS[detail.defaultPricingUnit]} /><Info label="Status" value={detail.isActive ? "Active" : "Inactive"} /><div className="col-span-2 rounded border border-[#E5EBF3] p-3 text-[#52627C]">{detail.description || "No description"}</div></div>}
    {tab === "services" && <div className="mt-5 space-y-3">{services.map((service) => { const mapping = detail?.mappings.find((entry) => entry.serviceId === service.id); return <form key={service.id} onSubmit={(event) => { event.preventDefault(); void saveMapping(service, mapping, event.currentTarget); }} className="rounded-lg border border-[#E3EAF3] p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-[13px] font-semibold text-[#071333]">{service.name}</p><p className="text-[11px] text-[#71809A]">{mapping?.isEnabled ? `${mapping.price.toFixed(2)} · ${mapping.turnaroundHours} hours` : "Not available for this item"}</p></div><label className="flex items-center gap-2 text-[11px] text-[#52627C]">Available<input name="enabled" type="checkbox" defaultChecked={mapping?.isEnabled ?? false} /></label></div>{(mapping?.isEnabled ?? false) && <div className="mt-3 grid grid-cols-2 gap-2"><Field label="Price"><Input name="price" type="number" min="0" step="0.01" defaultValue={mapping?.price ?? 0} className={inputClass} /></Field><Field label="Pricing unit"><select name="pricingUnit" defaultValue={mapping?.pricingUnit ?? detail?.defaultPricingUnit ?? "piece"} className={selectClass}>{PRICING_UNITS.map((unit) => <option key={unit} value={unit}>{PRICING_UNIT_LABELS[unit]}</option>)}</select></Field><Field label="Turnaround (hours)"><Input name="turnaroundHours" type="number" min="0" defaultValue={mapping?.turnaroundHours ?? 48} className={inputClass} /></Field><Field label="Express price"><Input name="expressPrice" type="number" min="0" step="0.01" defaultValue={mapping?.expressPrice ?? ""} className={inputClass} /></Field><label className="col-span-2 flex items-center gap-2 text-[11px] text-[#52627C]"><input name="expressAvailable" type="checkbox" defaultChecked={mapping?.expressAvailable ?? false} /> Express available</label><Field label="Express turnaround (hours)"><Input name="expressTurnaroundHours" type="number" min="0" defaultValue={mapping?.expressTurnaroundHours ?? ""} className={inputClass} /></Field><div className="flex items-end justify-end"><Button size="sm" type="submit" disabled={saving === service.id}>{saving === service.id ? "Saving…" : "Save pricing"}</Button></div></div>}</form>; })}</div>}
    {tab === "store" && <div className="mt-5 space-y-4"><form onSubmit={saveOverride} className="grid grid-cols-2 gap-3 rounded-lg border border-[#E3EAF3] bg-[#FAFCFF] p-3"><Field label="Store"><select name="storeId" defaultValue={storeForm.storeId} className={selectClass}>{stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></Field><Field label="Service"><select name="mappingId" required defaultValue={storeForm.mappingId} className={selectClass}><option value="">Select service</option>{enabledMappings.map((mapping) => <option key={mapping.id} value={mapping.id}>{mapping.serviceName}</option>)}</select></Field><Field label="Store price"><Input name="price" required type="number" min="0" step="0.01" className={inputClass} /></Field><Field label="Turnaround (hours)"><Input name="turnaroundHours" type="number" min="0" className={inputClass} /></Field><Field label="Express price"><Input name="expressPrice" type="number" min="0" step="0.01" className={inputClass} /></Field><div className="flex items-end"><Button type="submit" className="w-full">Save override</Button></div></form>{overrides.length ? <div className="space-y-2">{overrides.map((override) => <div key={override.id} className="flex items-center justify-between rounded border border-[#E5EBF3] px-3 py-2 text-[12px]"><span><b>{override.storeName}</b><span className="ml-2 text-[#71809A]">Mapping #{override.mappingId}</span></span><span className="font-semibold text-[#075DFF]">₹{override.price.toFixed(2)}</span></div>)}</div> : <p className="rounded border border-dashed border-[#C8D6E6] p-6 text-center text-[12px] text-[#71809A]">No store overrides for this item.</p>}</div>}
    {tab === "activity" && <p className="mt-5 rounded border border-dashed border-[#C8D6E6] p-6 text-center text-[12px] text-[#71809A]">Item activity will appear here as changes are made.</p>}
  </SheetContent></Sheet>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded border border-[#E5EBF3] p-3"><p className="text-[11px] text-[#71809A]">{label}</p><p className="mt-1 font-semibold text-[#071333]">{value}</p></div>; }

export function ItemsAdmin({ initialCategories, initialItems, initialServices, stores }: { initialCategories: ItemCategory[]; initialItems: ItemListRow[]; initialServices: ItemMasterService[]; stores: Store[] }) {
  const [items, setItems] = useState(initialItems); const [categories] = useState(initialCategories); const [services] = useState(initialServices); const [query, setQuery] = useState(""); const [category, setCategory] = useState("all"); const [formOpen, setFormOpen] = useState(false); const [editing, setEditing] = useState<ItemListRow | null>(null); const [detail, setDetail] = useState<ItemDetail | null>(null); const [detailOpen, setDetailOpen] = useState(false);
  async function refresh() { const data = await requestJson<{ items: ItemListRow[] }>("/api/admin/item-master/items"); setItems(data.items); }
  async function toggle(item: ItemListRow) { try { await requestJson(`/api/admin/item-master/items/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !item.isActive }) }); await refresh(); toast.success(item.isActive ? "Item deactivated" : "Item activated"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update item."); } }
  const filtered = useMemo(() => items.filter((item) => (!query || `${item.name} ${item.shortCode} ${item.categoryName}`.toLowerCase().includes(query.toLowerCase())) && (category === "all" || item.categoryId === Number(category))), [items, query, category]);
  async function remove(item: ItemListRow) { try { await requestJson(`/api/admin/item-master/items/${item.id}`, { method: "DELETE" }); await refresh(); toast.success("Item deleted"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete item."); } }
  async function openDetail(item: ItemListRow) { try { const data = await requestJson<{ item: ItemDetail }>(`/api/admin/item-master/items/${item.id}`); setDetail(data.item); setDetailOpen(true); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to open item."); } }
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-[17px] font-semibold text-[#071333]">Items</h2><p className="mt-1 text-[12px] text-[#71809A]">Manage one item and its available services.</p></div><Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="mr-1.5 h-4 w-4" />Add item</Button></div><Card><CardContent className="p-4"><div className="mb-4 flex flex-wrap gap-2"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8A99B0]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search items" className={`${inputClass} pl-9`} /></div><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-9 rounded border border-[#DCE6F2] bg-white px-3 text-[12px]"><option value="all">All categories</option>{categories.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Pricing unit</TableHead><TableHead>Services</TableHead><TableHead>Price range</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((item) => <TableRow key={item.id}><TableCell><button type="button" onClick={() => void openDetail(item)} className="text-left font-semibold text-[#075DFF] hover:underline">{item.name}<span className="ml-2 text-[11px] font-normal text-[#71809A]">{item.shortCode}</span></button></TableCell><TableCell>{item.categoryName}</TableCell><TableCell>{PRICING_UNIT_LABELS[item.defaultPricingUnit]}</TableCell><TableCell>{item.serviceCount}</TableCell><TableCell>{item.minPrice === null ? "—" : `₹${item.minPrice.toFixed(0)} – ₹${item.maxPrice?.toFixed(0)}`}</TableCell><TableCell>{statusBadge(item.isActive)}</TableCell><TableCell className="text-right"><ActionMenu actions={[{ label: "Edit", onSelect: () => { setEditing(item); setFormOpen(true); } }, { label: "Manage services", onSelect: () => void openDetail(item) }, { label: item.isActive ? "Deactivate" : "Activate", onSelect: () => void toggle(item) }, { label: "Delete", destructive: true, onSelect: () => void remove(item), confirm: { title: "Delete item?", message: `Delete ${item.name}? Items with service history cannot be deleted.`, confirmLabel: "Delete item" } }]} /></TableCell></TableRow>)}{filtered.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center text-[12px] text-[#71809A]">No items found.</TableCell></TableRow>}</TableBody></Table></div></CardContent></Card><ItemForm open={formOpen} onOpenChange={setFormOpen} item={editing} categories={categories} onSaved={(saved) => { setItems((current) => { const next = current.filter((entry) => entry.id !== saved.id); return [...next, saved]; }); }} /><ItemDetailSheet open={detailOpen} onOpenChange={setDetailOpen} item={detail} services={services} stores={stores} onChanged={() => void refresh()} /></div>;
}

export function ItemCategoriesAdmin({ initialCategories }: { initialCategories: ItemCategory[] }) {
  const [categories, setCategories] = useState(initialCategories); const [query, setQuery] = useState(""); const [open, setOpen] = useState(false); const [editing, setEditing] = useState<ItemCategory | null>(null); const [saving, setSaving] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); try { const values = new FormData(event.currentTarget); const file = values.get("image"); const imagePath = file instanceof File && file.size > 0 ? await uploadCatalogImage(file) : editing?.imagePath ?? ""; const body = { name: values.get("name"), description: values.get("description"), imagePath, sortOrder: Number(values.get("sortOrder")), isActive: values.get("isActive") === "on" }; const data = await requestJson<{ category: ItemCategory }>(editing ? `/api/admin/item-master/categories/${editing.id}` : "/api/admin/item-master/categories", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); setCategories((current) => editing ? current.map((entry) => entry.id === data.category.id ? data.category : entry) : [...current, data.category]); setOpen(false); toast.success(editing ? "Category updated" : "Category created"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save category."); } finally { setSaving(false); } }
  async function toggle(category: ItemCategory) { try { const data = await requestJson<{ category: ItemCategory }>(`/api/admin/item-master/categories/${category.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !category.isActive }) }); setCategories((current) => current.map((entry) => entry.id === category.id ? data.category : entry)); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update category."); } }
  async function removeCategory(category: ItemCategory) { try { await requestJson(`/api/admin/item-master/categories/${category.id}`, { method: "DELETE" }); setCategories((current) => current.filter((entry) => entry.id !== category.id)); toast.success("Category deleted"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete category."); } }
  const filtered = categories.filter((category) => category.name.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-[17px] font-semibold text-[#071333]">Garment categories</h2><Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1.5 h-4 w-4" />Add category</Button></div><Card><CardContent className="p-4"><div className="mb-4 relative max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8A99B0]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search categories" className={`${inputClass} pl-9`} /></div><Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Sort order</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((category) => <TableRow key={category.id}><TableCell className="font-semibold">{category.name}</TableCell><TableCell className="max-w-[300px] truncate text-[#71809A]">{category.description || "—"}</TableCell><TableCell>{category.sortOrder}</TableCell><TableCell>{statusBadge(category.isActive)}</TableCell><TableCell className="text-right"><ActionMenu actions={[{ label: "Edit", onSelect: () => { setEditing(category); setOpen(true); } }, { label: category.isActive ? "Deactivate" : "Activate", onSelect: () => void toggle(category) }, { label: "Delete", destructive: true, onSelect: () => void removeCategory(category), confirm: { title: "Delete category?", message: `Delete ${category.name}? Categories used by items cannot be deleted.`, confirmLabel: "Delete category" } }]} /></TableCell></TableRow>)}</TableBody></Table></CardContent></Card><Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full sm:max-w-[440px]"><SheetHeader><SheetTitle>{editing ? "Edit category" : "Add category"}</SheetTitle></SheetHeader><form onSubmit={save} className="mt-6 space-y-4"><Field label="Category name"><Input name="name" required defaultValue={editing?.name ?? ""} className={inputClass} /></Field><Field label="Description"><textarea name="description" defaultValue={editing?.description ?? ""} className="min-h-[90px] w-full rounded border border-[#DCE6F2] px-3 py-2 text-[12px]" /></Field><Field label={editing?.imagePath ? "Replace image or icon" : "Upload image or icon"}><Input name="image" type="file" accept="image/png,image/jpeg,image/webp" className="h-10 w-full rounded border border-dashed border-[#C8D6E6] bg-[#F8FBFF] px-3 py-2 text-[11px]" /></Field><Field label="Sort order"><Input name="sortOrder" type="number" min="0" defaultValue={editing?.sortOrder ?? 0} className={inputClass} /></Field><label className="flex items-center gap-2 text-[12px] font-medium text-[#31405A]"><input name="isActive" type="checkbox" defaultChecked={editing?.isActive ?? true} /> Active</label><SheetFooter><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save category"}</Button></SheetFooter></form></SheetContent></Sheet></div>;
}

export function MasterServicesAdmin({ initialServices }: { initialServices: ItemMasterService[] }) {
  const [services, setServices] = useState(initialServices); const [name, setName] = useState(""); const [saving, setSaving] = useState(false);
  async function add(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); try { const values = new FormData(event.currentTarget); const file = values.get("image"); const imagePath = file instanceof File && file.size > 0 ? await uploadCatalogImage(file) : ""; const data = await requestJson<{ service: ItemMasterService }>("/api/admin/item-master/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, imagePath }) }); setServices((current) => [...current, data.service]); setName(""); event.currentTarget.reset(); toast.success("Service created"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to create service."); } finally { setSaving(false); } }
  async function toggle(service: ItemMasterService) { try { const data = await requestJson<{ service: ItemMasterService }>(`/api/admin/item-master/services/${service.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !service.isActive }) }); setServices((current) => current.map((entry) => entry.id === service.id ? data.service : entry)); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update service."); } }
  return <div className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold text-[#071333]">Services</h2></div><Card><CardContent className="p-4"><form onSubmit={add} className="mb-5 flex max-w-lg gap-2"><Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="New service name" className={inputClass} /><Button type="submit" disabled={saving}><Plus className="mr-1.5 h-4 w-4" />Add</Button></form><Table><TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{services.map((service) => <TableRow key={service.id}><TableCell className="font-semibold">{service.name}</TableCell><TableCell className="text-[#71809A]">{service.slug}</TableCell><TableCell>{statusBadge(service.isActive)}</TableCell><TableCell className="text-right"><ActionMenu actions={[{ label: service.isActive ? "Deactivate" : "Activate", onSelect: () => void toggle(service) }]} /></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></div>;
}

function RateCardServiceRow({ groupId, itemId, mapping, onSaved }: { groupId: number; itemId: number; mapping: ItemServiceMapping; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(mapping.isEnabled);
  const [price, setPrice] = useState(String(mapping.price));

  async function save() {
    setSaving(true);
    try {
      await requestJson(`/api/admin/rate-card-groups/${groupId}/rates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mappingId: mapping.id,
          garmentId: itemId,
          serviceId: mapping.serviceId,
          isEnabled: enabled,
          price: Number(price),
          pricingUnit: mapping.pricingUnit,
          turnaroundHours: mapping.turnaroundHours,
          expressAvailable: mapping.expressAvailable,
          expressPrice: mapping.expressPrice,
          expressTurnaroundHours: mapping.expressTurnaroundHours,
        }),
      });
      toast.success(`${mapping.serviceName} rate saved`);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save rate.");
    } finally {
      setSaving(false);
    }
  }

  return <><label className="text-[12px] font-medium text-[#31405A]">Charge<span className="mt-1.5 block"><Input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0" step="0.01" className={inputClass} /></span></label><label className="flex items-center gap-1.5 text-[11px] text-[#52627C]"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Active</label><Button type="button" size="sm" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save charge"}</Button></>;
}

export function RateCardAdmin({ initialCategories, initialGroups, initialServices, initialStores, initialAssignments }: { initialCategories: ItemCategory[]; initialGroups: RateCardGroup[]; initialServices: ItemMasterService[]; initialStores: Store[]; initialAssignments: RateCardStoreAssignment[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [selectedGroupId, setSelectedGroupId] = useState(String(initialGroups.find((group) => group.isActive)?.id ?? initialGroups[0]?.id ?? ""));
  const [items, setItems] = useState<ItemDetail[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(String(initialServices.find((service) => service.isActive)?.id ?? initialServices[0]?.id ?? ""));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<RateCardGroup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [tariffCode, setTariffCode] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupSaving, setGroupSaving] = useState(false);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [assignmentStoreId, setAssignmentStoreId] = useState(initialAssignments[0]?.storeId ?? initialStores[0]?.id ?? "");
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const selectedGroup = groups.find((group) => String(group.id) === selectedGroupId) ?? null;
  const selectedService = initialServices.find((service) => String(service.id) === selectedServiceId) ?? null;
  const selectedAssignment = assignments.find((assignment) => assignment.storeId === assignmentStoreId) ?? null;

  async function loadGroupItems(groupId: string) {
    if (!groupId) { setItems([]); return; }
    setLoadingItems(true);
    try {
      const data = await requestJson<{ items: ItemDetail[] }>(`/api/admin/rate-card-groups/${groupId}/rates`);
      setItems(data.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load group rates.");
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => { void loadGroupItems(selectedGroupId); }, [selectedGroupId]);

  function openGroupForm(group: RateCardGroup | null = null) {
    setEditingGroup(group);
    setGroupName(group?.name ?? "");
    setTariffCode(group?.tariffCode ?? "");
    setGroupDescription(group?.description ?? "");
    setGroupFormOpen(true);
  }

  async function saveGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGroupSaving(true);
    try {
      const data = await requestJson<{ group: RateCardGroup }>(editingGroup ? `/api/admin/rate-card-groups/${editingGroup.id}` : "/api/admin/rate-card-groups", {
        method: editingGroup ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, tariffCode, description: groupDescription, isActive: editingGroup?.isActive ?? true }),
      });
      setGroups((current) => editingGroup ? current.map((group) => group.id === data.group.id ? data.group : group) : [...current, data.group]);
      if (!editingGroup) setSelectedGroupId(String(data.group.id));
      setGroupFormOpen(false);
      toast.success(editingGroup ? "Rate group updated" : "Rate group created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save rate group.");
    } finally {
      setGroupSaving(false);
    }
  }

  async function toggleGroup(group: RateCardGroup) {
    try {
      const data = await requestJson<{ group: RateCardGroup }>(`/api/admin/rate-card-groups/${group.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !group.isActive }) });
      setGroups((current) => current.map((entry) => entry.id === data.group.id ? data.group : entry));
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update rate group."); }
  }

  async function removeGroup(group: RateCardGroup) {
    try {
      await requestJson(`/api/admin/rate-card-groups/${group.id}`, { method: "DELETE" });
      const nextGroups = groups.filter((entry) => entry.id !== group.id);
      setGroups(nextGroups);
      if (String(group.id) === selectedGroupId) setSelectedGroupId(String(nextGroups.find((entry) => entry.isActive)?.id ?? nextGroups[0]?.id ?? ""));
      toast.success("Rate group deleted");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete rate group."); }
  }

  async function saveAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAssignmentSaving(true);
    try {
      const values = new FormData(event.currentTarget);
      await requestJson("/api/admin/rate-card-groups/assignments", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storeId: values.get("storeId"), groupId: values.get("groupId") || null }) });
      const data = await requestJson<{ assignments: RateCardStoreAssignment[] }>("/api/admin/rate-card-groups/assignments");
      setAssignments(data.assignments);
      toast.success("Tariff card assigned to store");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to assign tariff card."); } finally { setAssignmentSaving(false); }
  }

  const filtered = useMemo(() => items.filter((item) => (!query || `${item.name} ${item.shortCode} ${item.categoryName}`.toLowerCase().includes(query.toLowerCase())) && (category === "all" || item.categoryId === Number(category)) && item.mappings.some((mapping) => mapping.serviceId === Number(selectedServiceId))), [items, query, category, selectedServiceId]);

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-[17px] font-semibold text-[#071333]">Rate Card Master</h2><Button onClick={() => openGroupForm()}><Plus className="mr-1.5 h-4 w-4" />Add rate card</Button></div>
    <Card><CardContent className="p-4"><div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-[14px] font-semibold text-[#071333]">Rate cards</h3><span className="text-[11px] text-[#71809A]">Select a tariff before mapping charges</span></div>{groups.length === 0 ? <p className="rounded border border-dashed border-[#C8D6E6] p-6 text-center text-[12px] text-[#71809A]">No rate cards yet.</p> : <div className="flex flex-wrap gap-2">{groups.map((group) => <div key={group.id} className={`flex items-center rounded-lg border ${String(group.id) === selectedGroupId ? "border-[#075DFF] bg-[#F2F7FF]" : "border-[#E3EAF3] bg-white"}`}><button type="button" onClick={() => setSelectedGroupId(String(group.id))} className="px-3 py-2 text-left"><span className="block text-[12px] font-semibold text-[#071333]">{group.name}</span><span className="block text-[10px] text-[#71809A]">Tariff: {group.tariffCode || "Not set"}</span><span className="text-[10px] text-[#71809A]">{group.isActive ? "Active" : "Inactive"}</span></button><ActionMenu actions={[{ label: "Edit", onSelect: () => openGroupForm(group) }, { label: group.isActive ? "Deactivate" : "Activate", onSelect: () => void toggleGroup(group) }, { label: "Delete", destructive: true, onSelect: () => void removeGroup(group), confirm: { title: "Delete rate card?", message: `Delete ${group.name}? A rate card with charges cannot be deleted.`, confirmLabel: "Delete rate card" } }]} /></div>)}</div>}</CardContent></Card>
    <Card><CardContent className="p-4"><div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-[14px] font-semibold text-[#071333]">Store tariff assignment</h3><span className="text-[11px] text-[#71809A]">One tariff card per store</span></div>{initialStores.length ? <form onSubmit={saveAssignment} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><Field label="Store"><select name="storeId" value={assignmentStoreId} onChange={(event) => setAssignmentStoreId(event.target.value)} className={selectClass}>{initialStores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></Field><Field label="Tariff card"><select name="groupId" defaultValue={selectedAssignment?.groupId ?? ""} key={`${assignmentStoreId}-${selectedAssignment?.groupId ?? "none"}`} className={selectClass}><option value="">Use master item price</option>{groups.filter((group) => group.isActive).map((group) => <option key={group.id} value={group.id}>{group.name} · {group.tariffCode || "No code"}</option>)}</select></Field><div className="flex items-end"><Button type="submit" disabled={assignmentSaving}>{assignmentSaving ? "Saving…" : "Save assignment"}</Button></div></form> : <p className="text-[12px] text-[#71809A]">Create a store before assigning a tariff card.</p>}</CardContent></Card>
    {!selectedGroup ? <Card><CardContent className="p-8 text-center"><p className="text-[13px] font-medium text-[#071333]">Create a rate card first</p><Button className="mt-4" onClick={() => openGroupForm()}><Plus className="mr-1.5 h-4 w-4" />Add rate card</Button></CardContent></Card> : <Card><CardContent className="p-4"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-[15px] font-semibold text-[#071333]">Mapping</h3><p className="text-[11px] text-[#71809A]">{selectedGroup.name} · Tariff {selectedGroup.tariffCode || "not set"}</p></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><Field label="Select service"><select value={selectedServiceId} onChange={(event) => setSelectedServiceId(event.target.value)} className={`${selectClass} min-w-[190px]`}><option value="">Select service</option>{initialServices.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></Field><div className="flex items-end"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search items" className={`${inputClass} min-w-[150px]`} /></div></div></div><div className="mb-4"><p className="mb-2 text-[12px] font-medium text-[#31405A]">Select item category</p><div className="flex flex-wrap gap-2">{[{id:"all",name:"All"}, ...initialCategories.filter((entry) => ["men", "women", "kids", "kid"].includes(entry.name.toLowerCase()))].map((entry) => <button key={entry.id} type="button" onClick={() => setCategory(String(entry.id))} className={`rounded border px-3 py-1.5 text-[12px] ${category === String(entry.id) ? "border-[#075DFF] bg-[#EAF2FF] font-semibold text-[#075DFF]" : "border-[#DCE6F2] bg-white text-[#52627C]"}`}>{entry.name}</button>)}</div></div>{!selectedService ? <p className="rounded border border-dashed border-[#C8D6E6] p-8 text-center text-[12px] text-[#71809A]">Select a service before entering item charges.</p> : loadingItems ? <p className="rounded border border-dashed border-[#C8D6E6] p-8 text-center text-[12px] text-[#71809A]">Loading items…</p> : filtered.length === 0 ? <p className="rounded border border-dashed border-[#C8D6E6] p-8 text-center text-[12px] text-[#71809A]">No items found for {selectedService.name}.</p> : <div className="overflow-x-auto rounded-lg border border-[#E3EAF3]"><div className="grid min-w-[560px] grid-cols-[minmax(180px,1fr)_150px_90px_auto] gap-3 border-b border-[#E3EAF3] bg-[#FAFCFF] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#8A99B0]"><span>Item</span><span>Charge</span><span>Status</span><span /></div><div className="min-w-[560px]">{filtered.map((item) => { const mapping = item.mappings.find((entry) => entry.serviceId === Number(selectedServiceId)); return mapping ? <div key={item.id} className="grid grid-cols-[minmax(180px,1fr)_150px_90px_auto] items-center gap-3 border-b border-[#E8EEF5] px-3 py-2 last:border-b-0"><div><p className="text-[12px] font-semibold text-[#071333]">{item.name}</p><p className="text-[11px] text-[#71809A]">{item.shortCode}</p></div><RateCardServiceRow groupId={Number(selectedGroupId)} itemId={item.id} mapping={mapping} onSaved={() => void loadGroupItems(selectedGroupId)} /></div> : null; })}</div></div>}</CardContent></Card>}
    <Dialog open={groupFormOpen} onOpenChange={setGroupFormOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editingGroup ? "Edit rate card" : "Create rate card"}</DialogTitle></DialogHeader><form onSubmit={saveGroup} className="space-y-4 p-4"><Field label="Rate card name"><Input required value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Example: Standard rates" className={inputClass} /></Field><Field label="Tariff code"><Input required value={tariffCode} onChange={(event) => setTariffCode(event.target.value)} placeholder="Example: STD-001" className={inputClass} /></Field><Field label="Description"><textarea value={groupDescription} onChange={(event) => setGroupDescription(event.target.value)} placeholder="Optional" className="min-h-[80px] w-full rounded border border-[#DCE6F2] px-3 py-2 text-[12px]" /></Field><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setGroupFormOpen(false)}>Cancel</Button><Button type="submit" disabled={groupSaving}>{groupSaving ? "Saving…" : editingGroup ? "Save rate card" : "Create rate card"}</Button></div></form></DialogContent></Dialog>
  </div>;
}
