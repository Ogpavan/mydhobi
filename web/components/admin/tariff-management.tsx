"use client";

import { ArrowLeft, ArrowRight, LoaderCircle, Pencil, Plus, Search, SlidersHorizontal, Store as StoreIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PRICING_UNIT_LABELS, type ItemCategory, type RateCardGroup, type RateCardStoreAssignment } from "@/lib/item-master-types";
import type { Store } from "@/lib/stores";
import type { TariffItem, TariffMapping, TariffRate, TariffSheet } from "@/lib/tariffs";
import { cn } from "@/lib/utils";

type DraftRate = {
  price: string;
  isAvailable: boolean;
};

type DraftEntry = {
  key: string;
  itemId: number;
  serviceId: number;
  price: number | null;
  isAvailable: boolean;
  isValid: boolean;
};

const selectClass = "h-9 rounded-lg border border-[#DCE6F2] bg-white px-3 text-[12px] text-[#071333] outline-none focus:border-[#075DFF] focus:ring-1 focus:ring-[#075DFF]/20";
const emptyRate: TariffRate = { price: null, isAvailable: false, pricingUnit: "piece" };
const MAX_PRICE = 9_999_999_999.99;

function cellKey(itemId: number, serviceId: number) {
  return `${itemId}:${serviceId}`;
}

function parseCellKey(key: string) {
  const [itemId, serviceId] = key.split(":").map(Number);
  return { itemId, serviceId };
}

function displayPrice(price: number | null) {
  if (price === null) return "";
  return Number.isInteger(price) ? String(price) : price.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const body = await response.json().catch(() => null) as (T & { message?: string }) | null;
  if (!response.ok || !body) throw new Error(body?.message ?? "Something went wrong.");
  return body;
}

function PriceControl({
  item,
  serviceName,
  mapping,
  initial,
  draft,
  onChange,
}: {
  item: TariffItem;
  serviceName: string;
  mapping: TariffMapping | undefined;
  initial: TariffRate | undefined;
  draft: DraftRate | undefined;
  onChange: (draft: DraftRate) => void;
}) {
  const current = draft ?? {
    price: displayPrice(initial?.price ?? null),
    isAvailable: initial?.isAvailable ?? false,
  };
  const configured = initial !== undefined;
  const pricingUnit = mapping?.pricingUnit ?? initial?.pricingUnit ?? item.defaultPricingUnit;

  if (!mapping?.isMapped) {
    return (
      <div className="flex h-[58px] w-[160px] items-center justify-center px-2">
        <span className="w-full rounded-md border border-dashed border-[#DCE6F2] bg-[#FAFCFF] px-2 py-2 text-center text-[10px] font-medium text-[#94A3B8]">Not mapped</span>
      </div>
    );
  }

  return (
    <div className="flex h-[58px] w-[160px] flex-col justify-center gap-0.5 px-2 py-1.5">
      <div className="flex items-center gap-1.5">
        {current.isAvailable ? (
          <div className="flex h-8 min-w-0 flex-1 items-center rounded-md border border-[#DCE6F2] bg-white focus-within:border-[#075DFF] focus-within:ring-1 focus-within:ring-[#075DFF]/15">
            <span className="pl-2 text-[12px] font-medium text-[#52627C]">₹</span>
            <input
              aria-label={`${item.name} ${serviceName} price, ${PRICING_UNIT_LABELS[pricingUnit]}`}
              className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-right text-[13px] font-semibold text-[#071333] outline-none"
              inputMode="decimal"
              min="0"
              step="0.01"
              type="number"
              value={current.price}
              onChange={(event) => onChange({ isAvailable: true, price: event.target.value })}
            />
          </div>
        ) : (
          <button
            aria-label={`${item.name} ${serviceName}: ${configured ? "make available" : "set price"}`}
            className="flex h-8 min-w-0 flex-1 items-center justify-center rounded-md border border-dashed border-[#DCE6F2] bg-[#FAFCFF] px-2 text-[11px] font-medium text-[#71809A] hover:border-[#AFC7EA] hover:text-[#075DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075DFF]/20"
            type="button"
            onClick={() => onChange({ isAvailable: true, price: displayPrice(initial?.price ?? null) })}
          >
            {configured ? "Not available" : "Set price"}
          </button>
        )}
        {current.isAvailable ? (
          <button
            aria-label={`${item.name} ${serviceName}: mark not available`}
            className="h-8 shrink-0 rounded-md border border-[#BBD0F3] bg-[#F2F7FF] px-2 text-[10px] font-semibold text-[#075DFF] hover:border-[#075DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075DFF]/20"
            title="Mark not available"
            type="button"
            onClick={() => onChange({ isAvailable: false, price: "" })}
          >
            On
          </button>
        ) : null}
      </div>
      <span className="px-1 text-[9px] font-medium text-[#8A99B0]">{PRICING_UNIT_LABELS[pricingUnit]}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#C8D6E6] px-4 py-12 text-center text-[12px] text-[#71809A]">
      {message}
    </div>
  );
}

export function TariffManagement({
  initialCategories,
  initialStores,
  initialGroups,
  initialAssignments,
  initialGroupId,
}: {
  initialCategories: ItemCategory[];
  initialStores: Store[];
  initialGroups: RateCardGroup[];
  initialAssignments: RateCardStoreAssignment[];
  initialGroupId?: number;
}) {
  const categories = useMemo(() => initialCategories.filter((category) => category.isActive), [initialCategories]);
  const stores = useMemo(() => {
    const active = initialStores.filter((store) => store.status === "active");
    return active.length ? active : initialStores;
  }, [initialStores]);
  const editorMode = initialGroupId !== undefined;
  const [groups, setGroups] = useState(initialGroups);
  const [groupId, setGroupId] = useState(editorMode ? String(initialGroupId) : "");
  const [assignments, setAssignments] = useState(initialAssignments);
  const [categoryId, setCategoryId] = useState(String(categories[0]?.id ?? ""));
  const [sheet, setSheet] = useState<TariffSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, DraftRate>>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkServiceId, setBulkServiceId] = useState("");
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkPercent, setBulkPercent] = useState("");
  const [priceListOpen, setPriceListOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<RateCardGroup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupActive, setGroupActive] = useState(true);
  const [copySource, setCopySource] = useState("blank");
  const [groupSaving, setGroupSaving] = useState(false);
  const [assignmentsOpen, setAssignmentsOpen] = useState(false);
  const [assignmentDraft, setAssignmentDraft] = useState<Record<string, string>>(() => Object.fromEntries(
    initialAssignments.map((assignment) => [assignment.storeId, assignment.groupId === null ? "" : String(assignment.groupId)]),
  ));
  const [assignmentsSaving, setAssignmentsSaving] = useState(false);
  const [deleteGroup, setDeleteGroup] = useState<RateCardGroup | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const selectedGroup = groups.find((group) => String(group.id) === groupId) ?? null;

  const initialRates = useMemo(() => {
    const rates = new Map<string, TariffRate>();
    for (const item of sheet?.items ?? []) {
      for (const [serviceId, rate] of Object.entries(item.rates)) {
        rates.set(cellKey(item.id, Number(serviceId)), rate);
      }
    }
    return rates;
  }, [sheet]);

  const changedEntries = useMemo(() => Object.entries(drafts).flatMap(([key, draft]): DraftEntry[] => {
    const initial = initialRates.get(key) ?? emptyRate;
    const numericPrice = draft.price.trim() === "" ? null : Number(draft.price);
    const isValid = !draft.isAvailable || (
      numericPrice !== null && Number.isFinite(numericPrice) && numericPrice >= 0 && numericPrice <= MAX_PRICE
    );
    const same = draft.isAvailable === initial.isAvailable && (
      !draft.isAvailable || (isValid && numericPrice === initial.price)
    );
    if (same) return [];
    return [{ key, ...parseCellKey(key), price: draft.isAvailable ? numericPrice : null, isAvailable: draft.isAvailable, isValid }];
  }), [drafts, initialRates]);
  const changeCount = changedEntries.length;

  useEffect(() => {
    if (!groupId || !categoryId) {
      setSheet(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    setDrafts({});
    setSelectedItems(new Set());
    void requestJson<TariffSheet>(
      `/api/tariffs?groupId=${encodeURIComponent(groupId)}&categoryId=${encodeURIComponent(categoryId)}`,
      { signal: controller.signal },
    ).then((data) => {
      setSheet(data);
      setBulkServiceId((current) => current && data.services.some((service) => String(service.id) === current)
        ? current
        : String(data.services[0]?.id ?? ""));
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setLoadError(error instanceof Error ? error.message : "Unable to load tariffs.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [categoryId, groupId]);

  useEffect(() => {
    if (changeCount === 0) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changeCount]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sheet?.items ?? [];
    return (sheet?.items ?? []).filter((item) => `${item.name} ${item.shortCode}`.toLowerCase().includes(normalized));
  }, [query, sheet]);

  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedItems.has(item.id));

  function confirmDiscard() {
    return changeCount === 0 || window.confirm("Discard unsaved tariff changes?");
  }

  function changeCategory(nextCategoryId: string) {
    if (!confirmDiscard()) return;
    setCategoryId(nextCategoryId);
  }

  function openPriceList(group: RateCardGroup | null = null) {
    setEditingGroup(group);
    setGroupName(group?.name ?? "");
    setGroupActive(group?.isActive ?? true);
    setCopySource("blank");
    setPriceListOpen(true);
  }

  async function savePriceList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (groupSaving) return;
    setGroupSaving(true);
    try {
      const [copyType, copyId] = copySource.includes(":") ? copySource.split(":", 2) : [null, null];
      const data = await requestJson<{ group: RateCardGroup }>(editingGroup ? `/api/admin/rate-card-groups/${editingGroup.id}` : "/api/admin/rate-card-groups", {
        method: editingGroup ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          isActive: groupActive,
          copyType,
          copyId,
        }),
      });
      setGroups((current) => editingGroup
        ? current.map((group) => group.id === data.group.id ? data.group : group)
        : [...current, data.group]);
      if (!editingGroup) setGroupId(String(data.group.id));
      setPriceListOpen(false);
      toast.success(editingGroup ? "Price list updated" : "Price list created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save price list.");
    } finally {
      setGroupSaving(false);
    }
  }

  function openAssignments() {
    setAssignmentDraft(Object.fromEntries(stores.map((store) => {
      const assignment = assignments.find((entry) => entry.storeId === store.id);
      return [store.id, assignment?.groupId === null || assignment?.groupId === undefined ? "" : String(assignment.groupId)];
    })));
    setAssignmentsOpen(true);
  }

  async function saveAssignments() {
    if (assignmentsSaving) return;
    setAssignmentsSaving(true);
    try {
      const data = await requestJson<{ assignments: RateCardStoreAssignment[] }>("/api/admin/rate-card-groups/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignments: stores.map((store) => ({ storeId: store.id, groupId: assignmentDraft[store.id] || null })),
        }),
      });
      setAssignments(data.assignments);
      setAssignmentsOpen(false);
      toast.success("Store assignments saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save store assignments.");
    } finally {
      setAssignmentsSaving(false);
    }
  }

  async function deletePriceList() {
    if (!deleteGroup || deleteSaving) return;
    setDeleteSaving(true);
    try {
      await requestJson(`/api/admin/rate-card-groups/${deleteGroup.id}`, { method: "DELETE" });
      setGroups((current) => current.filter((group) => group.id !== deleteGroup.id));
      setDeleteGroup(null);
      toast.success("Price list deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete price list.");
    } finally {
      setDeleteSaving(false);
    }
  }

  function updateDraft(itemId: number, serviceId: number, draft: DraftRate) {
    const key = cellKey(itemId, serviceId);
    setDrafts((current) => ({ ...current, [key]: draft }));
  }

  function currentRate(item: TariffItem, serviceId: number): DraftRate {
    const key = cellKey(item.id, serviceId);
    const initial = item.rates[String(serviceId)];
    return drafts[key] ?? {
      isAvailable: initial?.isAvailable ?? false,
      price: displayPrice(initial?.price ?? null),
    };
  }

  function toggleItem(itemId: number) {
    setSelectedItems((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelectedItems((current) => {
      const next = new Set(current);
      if (allFilteredSelected) filteredItems.forEach((item) => next.delete(item.id));
      else filteredItems.forEach((item) => next.add(item.id));
      return next;
    });
  }

  function applyBulkPrice() {
    const serviceId = Number(bulkServiceId);
    const price = Number(bulkPrice);
    if (!Number.isInteger(serviceId) || bulkPrice.trim() === "" || !Number.isFinite(price) || price < 0 || price > MAX_PRICE) {
      toast.error("Enter a valid price.");
      return;
    }
    const mappedItems = (sheet?.items ?? []).filter((item) => selectedItems.has(item.id) && item.mappings[String(serviceId)]?.isMapped);
    if (!mappedItems.length) {
      toast.error("The selected items are not mapped to this service.");
      return;
    }
    for (const item of mappedItems) updateDraft(item.id, serviceId, { isAvailable: true, price: bulkPrice });
    toast.success(`Price set for ${mappedItems.length} ${mappedItems.length === 1 ? "item" : "items"}`);
    setBulkOpen(false);
  }

  function applyPercentage(direction: "increase" | "decrease") {
    const percent = Number(bulkPercent);
    if (bulkPercent.trim() === "" || !Number.isFinite(percent) || percent <= 0 || percent > 100) {
      toast.error("Enter a percent from 0 to 100.");
      return;
    }
    let updated = 0;
    for (const item of sheet?.items ?? []) {
      if (!selectedItems.has(item.id)) continue;
      for (const service of sheet?.services ?? []) {
        if (!item.mappings[String(service.id)]?.isMapped) continue;
        const rate = currentRate(item, service.id);
        const price = Number(rate.price);
        if (!rate.isAvailable || rate.price.trim() === "" || !Number.isFinite(price)) continue;
        const factor = direction === "increase" ? 1 + percent / 100 : 1 - percent / 100;
        const nextPrice = Math.max(0, Math.round(price * factor * 100) / 100);
        updateDraft(item.id, service.id, { isAvailable: true, price: displayPrice(nextPrice) });
        updated += 1;
      }
    }
    if (updated === 0) {
      toast.error("No available prices found for the selected items.");
      return;
    }
    toast.success(`${updated} ${updated === 1 ? "price" : "prices"} updated`);
    setBulkOpen(false);
  }

  async function saveChanges() {
    if (changeCount === 0 || saving) return;
    if (changedEntries.some((entry) => !entry.isValid)) {
      toast.error("Enter a valid price for each available service.");
      return;
    }
    setSaving(true);
    try {
      await requestJson<{ updated: number }>("/api/tariffs/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: Number(groupId),
          changes: changedEntries.map(({ itemId, serviceId, price, isAvailable }) => ({ itemId, serviceId, price, isAvailable })),
        }),
      });
      setSheet((current) => current ? {
        ...current,
        items: current.items.map((item) => {
          const itemChanges = changedEntries.filter((entry) => entry.itemId === item.id);
          if (!itemChanges.length) return item;
          const rates = { ...item.rates };
          for (const change of itemChanges) {
            rates[String(change.serviceId)] = {
              price: change.price,
              isAvailable: change.isAvailable,
              pricingUnit: item.mappings[String(change.serviceId)]?.pricingUnit ?? item.defaultPricingUnit,
            };
          }
          return { ...item, rates };
        }),
      } : current);
      setDrafts({});
      toast.success(`${changeCount} ${changeCount === 1 ? "price" : "prices"} saved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save tariffs.");
    } finally {
      setSaving(false);
    }
  }

  if (!categories.length) return <EmptyState message="Create a garment category before setting prices." />;

  const priceListDialog = (
    <Dialog open={priceListOpen} onOpenChange={setPriceListOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editingGroup ? "Edit price list" : "New price list"}</DialogTitle></DialogHeader>
        <form className="space-y-4 p-4" onSubmit={savePriceList}>
          <label className="block text-[12px] font-medium text-[#31405A]">
            Name
            <Input autoFocus className="mt-1.5" maxLength={100} placeholder="Standard prices" required value={groupName} onChange={(event) => setGroupName(event.target.value)} />
          </label>
          {!editingGroup ? (
            <label className="block text-[12px] font-medium text-[#31405A]">
              Start with
              <select className={`${selectClass} mt-1.5 w-full`} value={copySource} onChange={(event) => setCopySource(event.target.value)}>
                <option value="blank">Blank price list</option>
                {groups.filter((group) => group.isActive).map((group) => <option key={group.id} value={`group:${group.id}`}>Copy {group.name}</option>)}
                {stores.map((store) => <option key={store.id} value={`store:${store.id}`}>Copy {store.name} store prices</option>)}
              </select>
            </label>
          ) : (
            <label className="flex items-center gap-2 text-[12px] font-medium text-[#31405A]">
              <input checked={groupActive} className="h-4 w-4 accent-[#075DFF]" type="checkbox" onChange={(event) => setGroupActive(event.target.checked)} />
              Active
            </label>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPriceListOpen(false)}>Cancel</Button>
            <Button disabled={groupSaving} type="submit">{groupSaving ? "Saving..." : editingGroup ? "Save" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  const assignmentsDialog = (
    <Dialog open={assignmentsOpen} onOpenChange={setAssignmentsOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Assign stores</DialogTitle></DialogHeader>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto px-4 py-2">
          {stores.map((store) => (
            <label key={store.id} className="grid gap-2 rounded-lg border border-[#DCE6F2] bg-[#FAFCFF] p-3 text-[12px] font-medium text-[#31405A] sm:grid-cols-[minmax(130px,1fr)_minmax(190px,1.3fr)] sm:items-center">
              <span>{store.name}</span>
              <select className={`${selectClass} w-full`} value={assignmentDraft[store.id] ?? ""} onChange={(event) => setAssignmentDraft((current) => ({ ...current, [store.id]: event.target.value }))}>
                <option value="">Use store prices</option>
                {groups.filter((group) => group.isActive).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 p-4">
          <Button type="button" variant="outline" onClick={() => setAssignmentsOpen(false)}>Cancel</Button>
          <Button disabled={assignmentsSaving} type="button" onClick={() => void saveAssignments()}>{assignmentsSaving ? "Saving..." : "Save assignments"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const deleteDialog = (
    <Dialog open={Boolean(deleteGroup)} onOpenChange={(open) => { if (!open && !deleteSaving) setDeleteGroup(null); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Delete price list?</DialogTitle></DialogHeader>
        <div className="space-y-4 p-4">
          <p className="text-[13px] leading-5 text-[#52627C]">Delete {deleteGroup?.name}? Its saved prices will also be deleted.</p>
          <div className="flex justify-end gap-2">
            <Button disabled={deleteSaving} type="button" variant="outline" onClick={() => setDeleteGroup(null)}>Cancel</Button>
            <Button disabled={deleteSaving} type="button" variant="destructive" onClick={() => void deletePriceList()}>{deleteSaving ? "Deleting..." : "Delete"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (!editorMode) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <Button disabled={!stores.length || !groups.some((group) => group.isActive)} variant="outline" onClick={openAssignments}><StoreIcon className="h-4 w-4" /> Assign stores</Button>
          <Button onClick={() => openPriceList()}><Plus className="h-4 w-4" /> New price list</Button>
        </div>
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#AFC7EA] bg-white px-4 py-12 text-center">
            <p className="text-[13px] font-medium text-[#31405A]">No price lists yet</p>
            <Button className="mt-4" onClick={() => openPriceList()}><Plus className="h-4 w-4" /> New price list</Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => {
              const storeCount = assignments.filter((assignment) => assignment.groupId === group.id).length;
              return (
                <div key={group.id} className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.035)] transition-colors hover:border-[#AFC7EA]">
                  <Link href={`/admin/rate-card/${group.id}`} className="group block p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#075DFF]/20">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold text-[#071333]">{group.name}</span>
                        <span className="mt-3 flex items-center gap-3 text-[11px] font-medium">
                          <span className={group.isActive ? "text-[#15803D]" : "text-[#64748B]"}>{group.isActive ? "Active" : "Inactive"}</span>
                          <span className="text-[#71809A]">{storeCount} {storeCount === 1 ? "store" : "stores"}</span>
                        </span>
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F2F7FF] text-[#075DFF] transition-transform group-hover:translate-x-0.5"><ArrowRight className="h-4 w-4" /></span>
                    </div>
                  </Link>
                  <div className="flex border-t border-[#E8EEF5] px-2 py-1.5">
                    <Button className="flex-1" size="sm" type="button" variant="ghost" onClick={() => openPriceList(group)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                    <Button className="flex-1 text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#B91C1C]" size="sm" type="button" variant="ghost" onClick={() => setDeleteGroup(group)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {priceListDialog}
        {assignmentsDialog}
        {deleteDialog}
      </div>
    );
  }

  if (!selectedGroup) {
    return <div className="space-y-4"><Button asChild variant="outline"><Link href="/admin/rate-card"><ArrowLeft className="h-4 w-4" /> Price lists</Link></Button><EmptyState message="Price list not found." /></div>;
  }

  return (
    <div className="space-y-3 pb-20">
      <div className="rounded-lg border border-[#DCE6F2] bg-white p-3 shadow-[0_4px_14px_rgba(15,23,42,0.035)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E8EEF5] pb-3">
          <Button asChild size="sm" variant="outline"><Link href="/admin/rate-card"><ArrowLeft className="h-3.5 w-3.5" /> Price lists</Link></Button>
          <p className="mr-auto truncate text-[14px] font-semibold text-[#071333]">{selectedGroup.name}</p>
          <span className={cn("text-[11px] font-medium", selectedGroup.isActive ? "text-[#15803D]" : "text-[#64748B]")}>{selectedGroup.isActive ? "Active" : "Inactive"}</span>
          <Button size="sm" variant="outline" onClick={() => openPriceList(selectedGroup)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
          <Button size="sm" disabled={!stores.length || !groups.some((group) => group.isActive)} variant="outline" onClick={openAssignments}><StoreIcon className="h-3.5 w-3.5" /> Assign stores</Button>
        </div>
        <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1 lg:max-w-[360px]">
            <Search aria-hidden="true" className="absolute left-3 top-2.5 h-4 w-4 text-[#8A99B0]" />
            <Input aria-label="Search items" className="rounded-lg pl-9 text-[12px]" placeholder="Search items..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="flex items-center gap-2 lg:ml-auto">
            <Button asChild className="hidden sm:inline-flex" size="sm" variant="outline"><Link href="/admin/services/mapping">Service Mapping</Link></Button>
            <Button className="flex-1 lg:flex-none" size="sm" disabled={selectedItems.size === 0 || !sheet?.services.length} variant="outline" onClick={() => setBulkOpen(true)}><SlidersHorizontal className="h-3.5 w-3.5" /> Bulk edit{selectedItems.size ? ` (${selectedItems.size})` : ""}</Button>
            <Button className="flex-1 lg:flex-none" size="sm" disabled={changeCount === 0 || saving} onClick={() => void saveChanges()}>{saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}{saving ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </div>

      <div className="hidden gap-2 overflow-x-auto sm:flex">
        {categories.map((category) => (
          <button
            key={category.id}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors",
              String(category.id) === categoryId
                ? "border-[#075DFF] bg-[#F2F7FF] text-[#075DFF]"
                : "border-[#DCE6F2] bg-white text-[#64748B] hover:border-[#AFC7EA] hover:text-[#071333]",
            )}
            type="button"
            onClick={() => changeCategory(String(category.id))}
          >
            {category.name}
          </button>
        ))}
      </div>
      <select aria-label="Garment category" className={`${selectClass} w-full sm:hidden`} value={categoryId} onChange={(event) => changeCategory(event.target.value)}>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>

      {selectedItems.size > 0 ? (
        <div className="flex items-center justify-between rounded-lg border border-[#CFE0FF] bg-[#F5F8FF] px-3 py-2 text-[12px] text-[#31405A]">
          <span className="font-medium">{selectedItems.size} {selectedItems.size === 1 ? "item" : "items"} selected</span>
          <button className="font-medium text-[#075DFF] hover:underline" type="button" onClick={() => setSelectedItems(new Set())}>Clear</button>
        </div>
      ) : null}

      {!groupId ? (
        <div className="rounded-lg border border-dashed border-[#C8D6E6] px-4 py-12 text-center">
          <p className="text-[13px] font-medium text-[#31405A]">Create a price list to start</p>
          <Button className="mt-4" onClick={() => openPriceList()}><Plus className="h-4 w-4" /> New price list</Button>
        </div>
      ) : loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[12px] text-[#71809A]">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading prices...
        </div>
      ) : loadError ? (
        <EmptyState message={loadError} />
      ) : !sheet?.services.length ? (
        <EmptyState message="Add an active service before setting prices." />
      ) : filteredItems.length === 0 ? (
        <EmptyState message={query ? "No items match your search." : "No active items in this category."} />
      ) : (
        <>
          <div className="hidden max-h-[calc(100vh-245px)] overflow-auto rounded-lg border border-[#DCE6F2] bg-white md:block">
            <table className="w-max min-w-full border-separate border-spacing-0 text-left">
              <thead className="sticky top-0 z-20 bg-[#F8FAFD]">
                <tr>
                  <th className="sticky left-0 z-30 min-w-[210px] border-b border-r border-[#DCE6F2] bg-[#F8FAFD] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                    <label className="flex items-center gap-2">
                      <input aria-label="Select all shown items" checked={allFilteredSelected} className="h-4 w-4 accent-[#075DFF]" type="checkbox" onChange={toggleAllFiltered} />
                      Item
                    </label>
                  </th>
                  {sheet.services.map((service) => <th key={service.id} className="min-w-[160px] border-b border-r border-[#DCE6F2] px-3 py-2.5 text-center text-[11px] font-semibold text-[#31405A] last:border-r-0">{service.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="group hover:bg-[#FAFCFF]">
                    <th className="sticky left-0 z-10 border-b border-r border-[#E8EEF5] bg-white px-3 py-2 text-left group-hover:bg-[#FAFCFF]">
                      <label className="flex cursor-pointer items-center gap-2.5">
                        <input aria-label={`Select ${item.name}`} checked={selectedItems.has(item.id)} className="h-4 w-4 shrink-0 accent-[#075DFF]" type="checkbox" onChange={() => toggleItem(item.id)} />
                        <span className="min-w-0"><span className="block truncate text-[12px] font-semibold text-[#071333]">{item.name}</span><span className="block truncate text-[10px] font-normal text-[#8A99B0]">{item.shortCode}</span></span>
                      </label>
                    </th>
                    {sheet.services.map((service) => {
                      const key = cellKey(item.id, service.id);
                      return <td key={service.id} className="border-b border-r border-[#E8EEF5] p-0 last:border-r-0"><PriceControl item={item} serviceName={service.name} mapping={item.mappings[String(service.id)]} initial={item.rates[String(service.id)]} draft={drafts[key]} onChange={(draft) => updateDraft(item.id, service.id, draft)} /></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 md:hidden">
            <label className="flex items-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-[12px] font-medium text-[#31405A]">
              <input aria-label="Select all shown items" checked={allFilteredSelected} className="h-4 w-4 accent-[#075DFF]" type="checkbox" onChange={toggleAllFiltered} />
              Select all shown
            </label>
            {filteredItems.map((item) => (
              <section key={item.id} className="overflow-hidden rounded-lg border border-[#DCE6F2] bg-white">
                <label className="flex items-center gap-2.5 border-b border-[#E8EEF5] bg-[#F8FAFD] px-3 py-2.5">
                  <input aria-label={`Select ${item.name}`} checked={selectedItems.has(item.id)} className="h-4 w-4 accent-[#075DFF]" type="checkbox" onChange={() => toggleItem(item.id)} />
                  <span className="text-[13px] font-semibold text-[#071333]">{item.name}</span>
                </label>
                <div className="divide-y divide-[#E8EEF5]">
                  {sheet.services.map((service) => {
                    const key = cellKey(item.id, service.id);
                    return (
                      <div key={service.id} className="flex items-center justify-between gap-3 px-3 py-1.5">
                        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#52627C]">{service.name}</span>
                        <PriceControl item={item} serviceName={service.name} mapping={item.mappings[String(service.id)]} initial={item.rates[String(service.id)]} draft={drafts[key]} onChange={(draft) => updateDraft(item.id, service.id, draft)} />
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {changeCount > 0 ? (
        <div className="fixed bottom-3 left-3 right-3 z-40 flex items-center justify-between gap-3 rounded-lg border border-[#C8D6E6] bg-white px-3 py-2.5 shadow-[0_12px_32px_rgba(15,23,42,0.18)] sm:left-auto sm:right-6 sm:min-w-[390px]">
          <span className="text-[12px] font-semibold text-[#31405A]">{changeCount} unsaved {changeCount === 1 ? "change" : "changes"}</span>
          <div className="flex gap-2">
            <Button disabled={saving} size="sm" variant="outline" onClick={() => setDrafts({})}>Discard</Button>
            <Button disabled={saving} size="sm" onClick={() => void saveChanges()}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </div>
      ) : null}

      <Dialog open={priceListOpen} onOpenChange={setPriceListOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingGroup ? "Edit price list" : "New price list"}</DialogTitle></DialogHeader>
          <form className="space-y-4 p-4" onSubmit={savePriceList}>
            <label className="block text-[12px] font-medium text-[#31405A]">
              Name
              <Input autoFocus className="mt-1.5" maxLength={100} placeholder="Standard prices" required value={groupName} onChange={(event) => setGroupName(event.target.value)} />
            </label>
            {!editingGroup ? (
              <label className="block text-[12px] font-medium text-[#31405A]">
                Start with
                <select className={`${selectClass} mt-1.5 w-full`} value={copySource} onChange={(event) => setCopySource(event.target.value)}>
                  <option value="blank">Blank price list</option>
                  {groups.filter((group) => group.isActive).map((group) => <option key={group.id} value={`group:${group.id}`}>Copy {group.name}</option>)}
                  {stores.map((store) => <option key={store.id} value={`store:${store.id}`}>Copy {store.name} store prices</option>)}
                </select>
              </label>
            ) : (
              <label className="flex items-center gap-2 text-[12px] font-medium text-[#31405A]">
                <input checked={groupActive} className="h-4 w-4 accent-[#075DFF]" type="checkbox" onChange={(event) => setGroupActive(event.target.checked)} />
                Active
              </label>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPriceListOpen(false)}>Cancel</Button>
              <Button disabled={groupSaving} type="submit">{groupSaving ? "Saving..." : editingGroup ? "Save" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={assignmentsOpen} onOpenChange={setAssignmentsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Assign stores</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto px-4 py-2">
            {stores.map((store) => (
              <label key={store.id} className="grid gap-2 rounded-lg border border-[#DCE6F2] bg-[#FAFCFF] p-3 text-[12px] font-medium text-[#31405A] sm:grid-cols-[minmax(130px,1fr)_minmax(190px,1.3fr)] sm:items-center">
                <span>{store.name}</span>
                <select className={`${selectClass} w-full`} value={assignmentDraft[store.id] ?? ""} onChange={(event) => setAssignmentDraft((current) => ({ ...current, [store.id]: event.target.value }))}>
                  <option value="">Use store prices</option>
                  {groups.filter((group) => group.isActive).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 p-4">
            <Button type="button" variant="outline" onClick={() => setAssignmentsOpen(false)}>Cancel</Button>
            <Button disabled={assignmentsSaving} type="button" onClick={() => void saveAssignments()}>{assignmentsSaving ? "Saving..." : "Save assignments"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={bulkOpen} onOpenChange={setBulkOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-[420px]">
          <SheetHeader><SheetTitle>Bulk edit</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-3">
              <p className="text-[12px] font-semibold text-[#31405A]">Set service price</p>
              <label className="block text-[12px] font-medium text-[#52627C]">
                Service
                <select className={`${selectClass} mt-1.5 w-full`} value={bulkServiceId} onChange={(event) => setBulkServiceId(event.target.value)}>
                  {sheet?.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                </select>
              </label>
              <label className="block text-[12px] font-medium text-[#52627C]">
                Price
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-2 text-[13px] text-[#52627C]">₹</span>
                  <Input aria-label="Bulk price" className="rounded-lg pl-7" inputMode="decimal" min="0" step="0.01" type="number" value={bulkPrice} onChange={(event) => setBulkPrice(event.target.value)} />
                </div>
              </label>
              <Button className="w-full" type="button" onClick={applyBulkPrice}>Apply price</Button>
            </div>
            <div className="border-t border-[#E5EBF3] pt-5">
              <p className="mb-3 text-[12px] font-semibold text-[#31405A]">Change all available prices</p>
              <label className="block text-[12px] font-medium text-[#52627C]">
                Percent
                <div className="relative mt-1.5">
                  <Input aria-label="Bulk percent" className="rounded-lg pr-8" inputMode="decimal" max="100" min="0" step="0.01" type="number" value={bulkPercent} onChange={(event) => setBulkPercent(event.target.value)} />
                  <span className="absolute right-3 top-2 text-[13px] text-[#52627C]">%</span>
                </div>
              </label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => applyPercentage("decrease")}>Decrease</Button>
                <Button type="button" onClick={() => applyPercentage("increase")}>Increase</Button>
              </div>
            </div>
          </div>
          <SheetFooter className="mt-8"><Button variant="outline" onClick={() => setBulkOpen(false)}>Close</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
