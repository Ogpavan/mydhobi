import {
  MuiAction,
  MuiSelect,
  MuiTable,
  MuiTableBody,
  MuiTableCell,
  MuiTableHead,
  MuiTableHeaderCell,
  MuiTableRow,
} from "@/components/ui/native-controls";
import { apiFetch } from "@/platform/http";
import Link from "@/platform/navigation";
import { toast } from "@/platform/notifications";
import { LoaderCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PRICING_UNIT_LABELS,
  PRICING_UNITS,
  type ItemCategory,
  type PricingUnit,
} from "@/lib/item-master-types";
import type {
  ServiceMappingItem,
  ServiceMappingSheet,
  ServiceMappingValue,
} from "@/lib/service-mappings";
import { cn } from "@/lib/utils";

type DraftMapping = ServiceMappingValue;

type ChangedMapping = DraftMapping & {
  itemId: number;
  serviceId: number;
};

const selectClass =
  "h-9 rounded-lg border border-[#DCE6F2] bg-white px-3 text-[12px] text-[#071333] outline-none focus:border-[#075DFF] focus:ring-1 focus:ring-[#075DFF]/20";

function mappingKey(itemId: number, serviceId: number) {
  return `${itemId}:${serviceId}`;
}

function parseMappingKey(key: string) {
  const [itemId, serviceId] = key.split(":").map(Number);
  return { itemId, serviceId };
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await apiFetch(url, { ...init, cache: "no-store" });
  const body = (await response.json().catch(() => null)) as
    (T & { message?: string }) | null;
  if (!response.ok || !body)
    throw new Error(body?.message ?? "Something went wrong.");
  return body;
}

function MappingControl({
  item,
  serviceName,
  initial,
  draft,
  onChange,
}: {
  item: ServiceMappingItem;
  serviceName: string;
  initial: ServiceMappingValue | undefined;
  draft: DraftMapping | undefined;
  onChange: (value: DraftMapping) => void;
}) {
  const current = draft ??
    initial ?? { isMapped: false, pricingUnit: item.defaultPricingUnit };
  if (!current.isMapped) {
    return (
      <div className="flex h-[50px] w-[170px] items-center px-2">
        <MuiAction
          aria-label={`Map ${item.name} to ${serviceName}`}
          className="h-8 w-full rounded-md border border-dashed border-[#C8D6E6] bg-[#FAFCFF] text-[11px] font-medium text-[#52627C] hover:border-[#075DFF] hover:text-[#075DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075DFF]/20"
          type="button"
          onClick={() =>
            onChange({ isMapped: true, pricingUnit: current.pricingUnit })
          }
        >
          Map service
        </MuiAction>
      </div>
    );
  }

  return (
    <div className="flex h-[50px] w-[170px] items-center gap-1.5 px-2">
      <MuiSelect
        aria-label={`${item.name} ${serviceName} billing unit`}
        className="h-8 min-w-0 flex-1 rounded-md border border-[#DCE6F2] bg-white px-2 text-[11px] text-[#071333] outline-none focus:border-[#075DFF]"
        value={current.pricingUnit}
        onChange={(event) =>
          onChange({
            isMapped: true,
            pricingUnit: event.target.value as PricingUnit,
          })
        }
      >
        {PRICING_UNITS.map((unit) => (
          <option key={unit} value={unit}>
            {PRICING_UNIT_LABELS[unit]}
          </option>
        ))}
      </MuiSelect>
      <MuiAction
        aria-label={`Unmap ${item.name} from ${serviceName}`}
        className="h-8 shrink-0 rounded-md border border-[#BBD0F3] bg-[#F2F7FF] px-2 text-[10px] font-semibold text-[#075DFF] hover:border-[#075DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075DFF]/20"
        title="Remove mapping"
        type="button"
        onClick={() => {
          if (
            window.confirm(
              `Remove ${serviceName} from ${item.name}? It will become unavailable in every store.`,
            )
          ) {
            onChange({ isMapped: false, pricingUnit: current.pricingUnit });
          }
        }}
      >
        On
      </MuiAction>
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

export function ServiceMappingAdmin({
  initialCategories,
}: {
  initialCategories: ItemCategory[];
}) {
  const categories = useMemo(
    () => initialCategories.filter((category) => category.isActive),
    [initialCategories],
  );
  const [categoryId, setCategoryId] = useState(String(categories[0]?.id ?? ""));
  const [sheet, setSheet] = useState<ServiceMappingSheet | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftMapping>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialMappings = useMemo(() => {
    const values = new Map<string, ServiceMappingValue>();
    for (const item of sheet?.items ?? []) {
      for (const [serviceId, mapping] of Object.entries(item.mappings)) {
        values.set(mappingKey(item.id, Number(serviceId)), mapping);
      }
    }
    return values;
  }, [sheet]);

  const changes = useMemo(
    () =>
      Object.entries(drafts).flatMap(([key, draft]): ChangedMapping[] => {
        const { itemId, serviceId } = parseMappingKey(key);
        const item = sheet?.items.find((entry) => entry.id === itemId);
        const initial = initialMappings.get(key) ?? {
          isMapped: false,
          pricingUnit: item?.defaultPricingUnit ?? "piece",
        };
        if (
          draft.isMapped === initial.isMapped &&
          draft.pricingUnit === initial.pricingUnit
        )
          return [];
        return [{ itemId, serviceId, ...draft }];
      }),
    [drafts, initialMappings, sheet],
  );

  useEffect(() => {
    if (!categoryId) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setDrafts({});
    void requestJson<ServiceMappingSheet>(
      `/api/admin/service-mappings?categoryId=${encodeURIComponent(categoryId)}`,
      { signal: controller.signal },
    )
      .then(setSheet)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load service mappings.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [categoryId]);

  useEffect(() => {
    if (!changes.length) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changes.length]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (sheet?.items ?? []).filter(
      (item) =>
        !normalized ||
        `${item.name} ${item.shortCode}`.toLowerCase().includes(normalized),
    );
  }, [query, sheet]);

  function changeCategory(nextCategoryId: string) {
    if (
      changes.length &&
      !window.confirm("Discard unsaved service mapping changes?")
    )
      return;
    setCategoryId(nextCategoryId);
  }

  function updateDraft(itemId: number, serviceId: number, value: DraftMapping) {
    setDrafts((current) => ({
      ...current,
      [mappingKey(itemId, serviceId)]: value,
    }));
  }

  async function saveChanges() {
    if (!changes.length || saving) return;
    setSaving(true);
    try {
      await requestJson<{ updated: number }>("/api/admin/service-mappings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes }),
      });
      setSheet((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) => {
                const itemChanges = changes.filter(
                  (change) => change.itemId === item.id,
                );
                if (!itemChanges.length) return item;
                const mappings = { ...item.mappings };
                for (const change of itemChanges) {
                  mappings[String(change.serviceId)] = {
                    isMapped: change.isMapped,
                    pricingUnit: change.pricingUnit,
                  };
                }
                return { ...item, mappings };
              }),
            }
          : current,
      );
      setDrafts({});
      toast.success(
        `${changes.length} ${changes.length === 1 ? "mapping" : "mappings"} saved`,
      );
    } catch (reason) {
      toast.error(
        reason instanceof Error
          ? reason.message
          : "Unable to save service mappings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!categories.length)
    return (
      <EmptyState message="Create a garment category before mapping services." />
    );

  return (
    <div className="space-y-3 pb-20">
      <div className="flex flex-col gap-3 rounded-lg border border-[#DCE6F2] bg-white p-3 shadow-[0_4px_14px_rgba(15,23,42,0.035)] sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-[360px]">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-2.5 h-4 w-4 text-[#8A99B0]"
          />
          <Input
            aria-label="Search items"
            className="rounded-lg pl-9 text-[12px]"
            placeholder="Search items..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button asChild variant="outline">
            <Link href="/admin/rate-card">Tariffs</Link>
          </Button>
          <Button
            disabled={!changes.length || saving}
            onClick={() => void saveChanges()}
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="hidden gap-1 overflow-x-auto border-b border-[#DCE6F2] sm:flex">
        {categories.map((category) => (
          <MuiAction
            key={category.id}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-[12px] font-medium",
              String(category.id) === categoryId
                ? "border-[#075DFF] text-[#075DFF]"
                : "border-transparent text-[#64748B] hover:text-[#071333]",
            )}
            type="button"
            onClick={() => changeCategory(String(category.id))}
          >
            {category.name}
          </MuiAction>
        ))}
      </div>
      <MuiSelect
        aria-label="Garment category"
        className={`${selectClass} w-full sm:hidden`}
        value={categoryId}
        onChange={(event) => changeCategory(event.target.value)}
      >
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </MuiSelect>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[12px] text-[#71809A]">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading
          mappings...
        </div>
      ) : error ? (
        <EmptyState message={error} />
      ) : !sheet?.services.length ? (
        <EmptyState message="Add an active service before creating mappings." />
      ) : !filteredItems.length ? (
        <EmptyState
          message={
            query
              ? "No items match your search."
              : "No active items in this category."
          }
        />
      ) : (
        <>
          <div className="hidden max-h-[calc(100vh-235px)] overflow-auto rounded-lg border border-[#DCE6F2] bg-white md:block">
            <MuiTable className="w-max min-w-full border-separate border-spacing-0 text-left">
              <MuiTableHead className="sticky top-0 z-20 bg-[#F8FAFD]">
                <MuiTableRow>
                  <MuiTableHeaderCell className="sticky left-0 z-30 min-w-[210px] border-b border-r border-[#DCE6F2] bg-[#F8FAFD] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                    Item
                  </MuiTableHeaderCell>
                  {sheet.services.map((service) => (
                    <MuiTableHeaderCell
                      key={service.id}
                      className="min-w-[170px] border-b border-r border-[#DCE6F2] px-3 py-2.5 text-center text-[11px] font-semibold text-[#31405A] last:border-r-0"
                    >
                      {service.name}
                    </MuiTableHeaderCell>
                  ))}
                </MuiTableRow>
              </MuiTableHead>
              <MuiTableBody>
                {filteredItems.map((item) => (
                  <MuiTableRow
                    key={item.id}
                    className="group hover:bg-[#FAFCFF]"
                  >
                    <MuiTableHeaderCell className="sticky left-0 z-10 border-b border-r border-[#E8EEF5] bg-white px-3 py-2 text-left group-hover:bg-[#FAFCFF]">
                      <span className="block text-[12px] font-semibold text-[#071333]">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-normal text-[#8A99B0]">
                        Default: {PRICING_UNIT_LABELS[item.defaultPricingUnit]}
                      </span>
                    </MuiTableHeaderCell>
                    {sheet.services.map((service) => {
                      const key = mappingKey(item.id, service.id);
                      return (
                        <MuiTableCell
                          key={service.id}
                          className="border-b border-r border-[#E8EEF5] p-0 last:border-r-0"
                        >
                          <MappingControl
                            item={item}
                            serviceName={service.name}
                            initial={item.mappings[String(service.id)]}
                            draft={drafts[key]}
                            onChange={(value) =>
                              updateDraft(item.id, service.id, value)
                            }
                          />
                        </MuiTableCell>
                      );
                    })}
                  </MuiTableRow>
                ))}
              </MuiTableBody>
            </MuiTable>
          </div>

          <div className="space-y-2 md:hidden">
            {filteredItems.map((item) => (
              <section
                key={item.id}
                className="overflow-hidden rounded-lg border border-[#DCE6F2] bg-white"
              >
                <div className="border-b border-[#E8EEF5] bg-[#F8FAFD] px-3 py-2.5">
                  <h2 className="text-[13px] font-semibold text-[#071333]">
                    {item.name}
                  </h2>
                  <span className="text-[10px] text-[#8A99B0]">
                    Default: {PRICING_UNIT_LABELS[item.defaultPricingUnit]}
                  </span>
                </div>
                <div className="divide-y divide-[#E8EEF5]">
                  {sheet.services.map((service) => {
                    const key = mappingKey(item.id, service.id);
                    return (
                      <div
                        key={service.id}
                        className="flex items-center justify-between gap-3 px-3 py-1.5"
                      >
                        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#52627C]">
                          {service.name}
                        </span>
                        <MappingControl
                          item={item}
                          serviceName={service.name}
                          initial={item.mappings[String(service.id)]}
                          draft={drafts[key]}
                          onChange={(value) =>
                            updateDraft(item.id, service.id, value)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {changes.length ? (
        <div className="fixed bottom-3 left-3 right-3 z-40 flex items-center justify-between gap-3 rounded-lg border border-[#C8D6E6] bg-white px-3 py-2.5 shadow-[0_12px_32px_rgba(15,23,42,0.18)] sm:left-auto sm:right-6 sm:min-w-[400px]">
          <span className="text-[12px] font-semibold text-[#31405A]">
            {changes.length} unsaved{" "}
            {changes.length === 1 ? "change" : "changes"}
          </span>
          <div className="flex gap-2">
            <Button
              disabled={saving}
              size="sm"
              variant="outline"
              onClick={() => setDrafts({})}
            >
              Discard
            </Button>
            <Button
              disabled={saving}
              size="sm"
              onClick={() => void saveChanges()}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
