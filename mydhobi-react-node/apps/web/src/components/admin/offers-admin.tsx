import { MuiInput, MuiSelect } from "@/components/ui/native-controls";
import { apiFetch } from "@/platform/http";
import { toast } from "@/platform/notifications";
import { Gift, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import type { Offer } from "@/lib/offers";
import type { StoreDiscountPolicy } from "@/lib/stores";

function localDate(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

type AdminOffersProps = {
  initialOffers: Offer[];
  policy: StoreDiscountPolicy | null;
  storeManager: boolean;
};

export function AdminOffers({
  initialOffers,
  policy,
  storeManager,
}: AdminOffersProps) {
  const [offers, setOffers] = useState(initialOffers);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Offer | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discountType, setDiscountType] =
    useState<Offer["discountType"]>("Percentage");
  const [discountValue, setDiscountValue] = useState(20);
  const visible = useMemo(
    () =>
      offers.filter((item) =>
        `${item.code} ${item.title} ${item.storeName ?? ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [offers, query],
  );
  const now = new Date();
  const monthLater = new Date(now.getTime() + 30 * 86400000);
  const canAdd = !storeManager || policy?.discountsEnabled === true;
  const requiredFlatMinimum =
    storeManager && policy && policy.maxDiscountPercent < 100
      ? Math.ceil(((discountValue * 100) / policy.maxDiscountPercent) * 100) /
        100
      : 0;

  function edit(offer?: Offer) {
    setSelected(offer ?? null);
    setDiscountType(offer?.discountType ?? "Percentage");
    setDiscountValue(
      offer?.discountValue ?? Math.min(policy?.maxDiscountPercent ?? 20, 20),
    );
    setOpen(true);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      code: form.get("code"),
      title: form.get("title"),
      discountType,
      discountValue: form.get("discountValue"),
      minOrder: form.get("minOrder"),
      maxDiscount: form.get("maxDiscount"),
      startsAt: new Date(String(form.get("startsAt"))).toISOString(),
      endsAt: new Date(String(form.get("endsAt"))).toISOString(),
      usageLimit: form.get("usageLimit"),
      isActive: form.get("isActive") === "on",
    };
    try {
      const request = await apiFetch(
        selected ? `/api/admin/offers/${selected.id}` : "/api/admin/offers",
        {
          method: selected ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await request.json()) as {
        offer?: Offer;
        message?: string;
      };
      if (!request.ok || !data.offer) {
        toast.error(data.message ?? "Unable to save offer");
        return;
      }
      setOffers((current) =>
        selected
          ? current.map((item) =>
              item.id === data.offer?.id ? data.offer : item,
            )
          : [data.offer!, ...current],
      );
      setOpen(false);
      toast.success(selected ? "Offer updated" : "Offer created");
    } catch {
      toast.error("Unable to save offer");
    } finally {
      setSaving(false);
    }
  }

  async function remove(offer: Offer) {
    if (!confirm(`Delete ${offer.code}?`)) return;
    try {
      const request = await apiFetch(`/api/admin/offers/${offer.id}`, {
        method: "DELETE",
      });
      const data = (await request.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!request.ok) {
        toast.error(data?.message ?? "Unable to delete offer");
        return;
      }
      setOffers((current) => current.filter((item) => item.id !== offer.id));
      toast.success("Offer deleted");
    } catch {
      toast.error("Unable to delete offer");
    }
  }

  return (
    <div className="space-y-3">
      {storeManager && policy ? (
        <div
          className={
            policy.discountsEnabled
              ? "flex flex-wrap items-center gap-x-4 gap-y-2 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"
              : "flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"
          }
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          {policy.discountsEnabled ? (
            <>
              <span className="font-medium">Store limit</span>
              <span>Up to {policy.maxDiscountPercent}%</span>
              <span>
                Up to ₹{policy.maxDiscountAmount.toLocaleString("en-IN")}
              </span>
            </>
          ) : (
            <span>Store discounts are off.</span>
          )}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total Offers", value: offers.length },
          {
            label: "Active",
            value: offers.filter(
              (item) => item.isActive && new Date(item.endsAt) > now,
            ).length,
          },
          {
            label: "Used",
            value: offers.reduce((sum, item) => sum + item.usageCount, 0),
          },
          {
            label: "Expired",
            value: offers.filter((item) => new Date(item.endsAt) <= now).length,
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex h-[88px] items-center gap-3 p-4">
              <Gift className="h-7 w-7 text-[#6D28D9]" />
              <div>
                <p className="text-[12px] text-[#52627A]">{item.label}</p>
                <p className="mt-1 text-[22px] font-semibold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="flex-row items-center gap-3 p-4">
          <label className="relative block min-w-0 max-w-[420px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52627A]" />
            <span className="sr-only">Search offers</span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search code or offer"
              className="pl-9"
            />
          </label>
          <Button
            onClick={() => edit()}
            disabled={!canAdd}
            className="ml-auto bg-[#075DFF]"
          >
            <Plus className="mr-1 h-4 w-4" /> Add Offer
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Offer</TableHead>
                {!storeManager ? <TableHead>Store</TableHead> : null}
                <TableHead>Discount</TableHead>
                <TableHead>Minimum</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length ? (
                visible.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-semibold text-[#075DFF]">
                      {offer.code}
                    </TableCell>
                    <TableCell>{offer.title}</TableCell>
                    {!storeManager ? (
                      <TableCell>{offer.storeName ?? "All Stores"}</TableCell>
                    ) : null}
                    <TableCell>
                      {offer.discountType === "Percentage"
                        ? `${offer.discountValue}%`
                        : `₹${offer.discountValue}`}
                    </TableCell>
                    <TableCell>₹{offer.minOrder}</TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(offer.endsAt))}
                    </TableCell>
                    <TableCell>
                      {offer.usageCount}
                      {offer.usageLimit ? ` / ${offer.usageLimit}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          offer.isActive && new Date(offer.endsAt) > now
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }
                      >
                        {offer.isActive && new Date(offer.endsAt) > now
                          ? "Active"
                          : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${offer.code}`}
                        title={`Edit ${offer.code}`}
                        onClick={() => edit(offer)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${offer.code}`}
                        title={`Delete ${offer.code}`}
                        onClick={() => void remove(offer)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={storeManager ? 8 : 9}
                    className="h-32 text-center text-[#52627A]"
                  >
                    No offers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[620px]">
          <DialogHeader>
            <DialogTitle>{selected ? "Edit Offer" : "Add Offer"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={save}
            className="grid max-h-[75vh] gap-3 overflow-y-auto p-4 sm:grid-cols-2"
          >
            <label className="text-[12px] font-medium">
              Coupon Code
              <Input
                name="code"
                defaultValue={selected?.code ?? ""}
                className="mt-1.5"
                required
              />
            </label>
            <label className="text-[12px] font-medium">
              Offer Name
              <Input
                name="title"
                defaultValue={selected?.title ?? ""}
                className="mt-1.5"
                required
              />
            </label>
            <label className="text-[12px] font-medium">
              Discount Type
              <MuiSelect
                value={discountType}
                onChange={(event) =>
                  setDiscountType(event.target.value as Offer["discountType"])
                }
                className="mt-1.5 h-10 w-full rounded border border-[#DCE6F2] bg-white px-3"
              >
                <option>Percentage</option>
                <option>Flat</option>
              </MuiSelect>
            </label>
            <label className="text-[12px] font-medium">
              Discount Value
              <Input
                name="discountValue"
                type="number"
                inputMode="decimal"
                min="0.01"
                max={
                  storeManager
                    ? discountType === "Percentage"
                      ? policy?.maxDiscountPercent
                      : policy?.maxDiscountAmount
                    : discountType === "Percentage"
                      ? 100
                      : undefined
                }
                step="0.01"
                value={discountValue}
                onChange={(event) =>
                  setDiscountValue(Number(event.target.value))
                }
                className="mt-1.5"
                required
              />
            </label>
            <label className="text-[12px] font-medium">
              Minimum Order
              <Input
                name="minOrder"
                type="number"
                inputMode="decimal"
                min={discountType === "Flat" ? requiredFlatMinimum : 0}
                step="0.01"
                defaultValue={selected?.minOrder ?? requiredFlatMinimum}
                className="mt-1.5"
                required
              />
            </label>
            <label className="text-[12px] font-medium">
              Maximum Discount
              <Input
                name="maxDiscount"
                type="number"
                inputMode="decimal"
                min="0.01"
                max={storeManager ? policy?.maxDiscountAmount : undefined}
                step="0.01"
                defaultValue={
                  selected?.maxDiscount ??
                  (storeManager && discountType === "Percentage"
                    ? policy?.maxDiscountAmount
                    : "")
                }
                className="mt-1.5"
                required={storeManager && discountType === "Percentage"}
              />
            </label>
            <label className="text-[12px] font-medium">
              Use Limit
              <Input
                name="usageLimit"
                type="number"
                min="1"
                step="1"
                defaultValue={selected?.usageLimit ?? ""}
                className="mt-1.5"
              />
            </label>
            <label className="text-[12px] font-medium">
              Starts At
              <Input
                name="startsAt"
                type="datetime-local"
                defaultValue={localDate(
                  selected?.startsAt ?? now.toISOString(),
                )}
                className="mt-1.5"
                required
              />
            </label>
            <label className="text-[12px] font-medium">
              Ends At
              <Input
                name="endsAt"
                type="datetime-local"
                defaultValue={localDate(
                  selected?.endsAt ?? monthLater.toISOString(),
                )}
                className="mt-1.5"
                required
              />
            </label>
            <label className="flex items-center gap-2 self-end py-2 text-[12px] font-medium">
              <MuiInput
                name="isActive"
                type="checkbox"
                defaultChecked={selected?.isActive ?? true}
                className="h-4 w-4 accent-[#075DFF]"
              />
              Active
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button disabled={saving} className="bg-[#075DFF]">
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
