import { MuiSelect } from "@/components/ui/native-controls";
import { apiFetch } from "@/platform/http";
import { toast } from "@/platform/notifications";
import type { OrderCharge, OrderChargeType } from "@/lib/order-charges";
import { orderChargeCodeFromName } from "@/lib/order-charges";
import { Checkbox, FormControlLabel } from "@mui/material";
import { Pencil, Plus, ReceiptText, Search } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
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

const selectClassName =
  "h-9 w-full rounded border border-[#DCE6F2] bg-white px-3 text-[12px] text-[#071333] outline-none transition-colors focus:border-[#075DFF] focus:ring-1 focus:ring-[#075DFF]/20";
const labelClassName = "block text-[11px] font-medium text-[#385071]";
const typeLabels: Record<OrderChargeType, string> = {
  extra: "Extra",
  delivery: "Delivery",
  tax: "Tax",
};

async function readResponse<T>(response: Response) {
  return (await response.json().catch(() => null)) as
    (T & { message?: string }) | null;
}

function displayAmount(charge: OrderCharge) {
  return charge.type === "tax"
    ? `${charge.amount}%`
    : `₹${charge.amount.toLocaleString("en-IN")}`;
}

export function OrderChargeMaster({
  initialCharges,
}: {
  initialCharges: OrderCharge[];
}) {
  const [charges, setCharges] = useState(initialCharges);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<OrderCharge | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<OrderChargeType>("extra");
  const [amount, setAmount] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const visibleCharges = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? charges.filter((charge) =>
          `${charge.name} ${charge.code} ${charge.type}`
            .toLowerCase()
            .includes(normalized),
        )
      : charges;
  }, [charges, query]);

  function openCreate() {
    setSelected(null);
    setName("");
    setType("extra");
    setAmount("");
    setIsActive(true);
    setDialogOpen(true);
  }

  function openEdit(charge: OrderCharge) {
    setSelected(charge);
    setName(charge.name);
    setType(charge.type);
    setAmount(String(charge.amount));
    setIsActive(charge.isActive);
    setDialogOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      code: selected?.code ?? orderChargeCodeFromName(name),
      name,
      type,
      amount: Number(amount),
      isActive,
    };
    try {
      const response = await apiFetch(
        selected
          ? `/api/settings/order-charges/${selected.id}`
          : "/api/settings/order-charges",
        {
          method: selected ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await readResponse<{ charge?: OrderCharge }>(response);
      if (!response.ok || !data?.charge) {
        toast.error(data?.message ?? "Unable to save charge.");
        return;
      }
      setCharges((current) =>
        selected
          ? current
              .map((charge) =>
                charge.id === data.charge!.id ? data.charge! : charge,
              )
              .sort((a, b) =>
                `${a.type}-${a.name}`.localeCompare(`${b.type}-${b.name}`),
              )
          : [...current, data.charge!].sort((a, b) =>
              `${a.type}-${a.name}`.localeCompare(`${b.type}-${b.name}`),
            ),
      );
      setDialogOpen(false);
      toast.success(selected ? "Charge updated" : "Charge created");
    } catch {
      toast.error("Unable to save charge right now.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(charge: OrderCharge) {
    setUpdatingId(charge.id);
    try {
      const response = await apiFetch(
        `/api/settings/order-charges/${charge.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: charge.code,
            name: charge.name,
            type: charge.type,
            amount: charge.amount,
            isActive: !charge.isActive,
          }),
        },
      );
      const data = await readResponse<{ charge?: OrderCharge }>(response);
      if (!response.ok || !data?.charge) {
        toast.error(data?.message ?? "Unable to update charge.");
        return;
      }
      setCharges((current) =>
        current.map((item) =>
          item.id === data.charge!.id ? data.charge! : item,
        ),
      );
      toast.success(
        data.charge.isActive ? "Charge enabled" : "Charge disabled",
      );
    } catch {
      toast.error("Unable to update charge right now.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-[360px]">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71809A]"
          />
          <Input
            aria-label="Search charges"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search charges"
            className="h-9 pl-9 shadow-none"
          />
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus /> Add charge
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border border-[#DCE6F2] bg-white">
        <div className="flex items-center gap-2 border-b border-[#E7EDF5] bg-[#F8FAFD] px-4 py-3">
          <ReceiptText className="h-4 w-4 text-[#075DFF]" />
          <span className="text-[13px] font-semibold text-[#071333]">
            Charges
          </span>
          <span className="text-[11px] text-[#71809A]">
            {visibleCharges.length} shown
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Charge</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleCharges.length ? (
                visibleCharges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>
                      <div className="font-medium text-[#071333]">
                        {charge.name}
                      </div>
                      <div className="mt-0.5 text-[10px] text-[#71809A]">
                        {charge.code}
                      </div>
                    </TableCell>
                    <TableCell>{typeLabels[charge.type]}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {displayAmount(charge)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          charge.isActive
                            ? "bg-[#E9F8EF] text-[#15803D]"
                            : "bg-[#F1F3F6] text-[#64748B]"
                        }
                      >
                        {charge.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(charge)}
                        >
                          <Pencil /> Edit
                        </Button>
                        <Button
                          type="button"
                          variant={charge.isActive ? "destructive" : "ghost"}
                          size="sm"
                          disabled={updatingId === charge.id}
                          onClick={() => void toggleActive(charge)}
                        >
                          {charge.isActive ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    No charges found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => !saving && setDialogOpen(open)}
      >
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{selected ? "Edit charge" : "Add charge"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4 p-4">
            <label className={labelClassName}>
              Charge name
              <Input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Stain removal"
                maxLength={80}
                className="mt-1.5 shadow-none"
              />
            </label>
            <label className={labelClassName}>
              Type
              <MuiSelect
                value={type}
                onChange={(event) =>
                  setType(event.target.value as OrderChargeType)
                }
                className={`${selectClassName} mt-1.5`}
              >
                <option value="extra">Extra charge</option>
                <option value="delivery">Delivery charge</option>
                <option value="tax">Tax percentage</option>
              </MuiSelect>
            </label>
            <label className={labelClassName}>
              {type === "tax" ? "Rate (%)" : "Amount (₹)"}
              <Input
                type="number"
                min={0}
                max={type === "tax" ? 100 : 100000}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0"
                className="mt-1.5 shadow-none"
              />
            </label>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                />
              }
              label="Active"
              sx={{
                m: 0,
                "& .MuiFormControlLabel-label": {
                  fontSize: 12,
                  color: "#385071",
                },
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save charge"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
