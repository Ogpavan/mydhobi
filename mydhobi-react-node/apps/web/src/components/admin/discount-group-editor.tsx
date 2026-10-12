import { MuiSelect } from "@/components/ui/native-controls";
import { apiFetch } from "@/platform/http";
import Link, { useRouter } from "@/platform/navigation";
import { toast } from "@/platform/notifications";
import { ArrowLeft, Save } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  DiscountGroupDetails,
  DiscountGroupPayload,
  DiscountType,
} from "@/lib/discount-groups";
import type { ItemMasterService } from "@/lib/item-master-types";

type RuleDraft = {
  serviceId: number;
  discountType: DiscountType;
  discountValue: string;
};

function draftsFor(
  services: ItemMasterService[],
  group?: DiscountGroupDetails,
): RuleDraft[] {
  const existing = new Map(group?.rules.map((rule) => [rule.serviceId, rule]));
  return services.map((service) => {
    const rule = existing.get(service.id);
    return {
      serviceId: service.id,
      discountType: rule?.discountType ?? "Percentage",
      discountValue: String(rule?.discountValue ?? 0),
    };
  });
}

export function DiscountGroupEditor({
  mode,
  services,
  group,
}: {
  mode: "create" | "edit";
  services: ItemMasterService[];
  group?: DiscountGroupDetails;
}) {
  const router = useRouter();
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [isActive, setIsActive] = useState(group?.isActive ?? true);
  const [rules, setRules] = useState(() => draftsFor(services, group));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const serviceById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  );

  function updateRule(serviceId: number, update: Partial<RuleDraft>) {
    setRules((current) =>
      current.map((rule) =>
        rule.serviceId === serviceId ? { ...rule, ...update } : rule,
      ),
    );
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("Discount group name is required.");
      return;
    }
    const payload: DiscountGroupPayload = {
      name: normalizedName,
      description: description.trim(),
      isActive,
      rules: rules.map((rule) => ({
        serviceId: rule.serviceId,
        discountType: rule.discountType,
        discountValue: Number(rule.discountValue),
      })),
    };
    const invalid = rules.find(
      (rule) =>
        !Number.isFinite(Number(rule.discountValue)) ||
        Number(rule.discountValue) < 0 ||
        (rule.discountType === "Percentage" &&
          Number(rule.discountValue) > 100),
    );
    if (invalid) {
      setError(
        invalid.discountType === "Percentage"
          ? "Percentage discounts must be between 0% and 100%."
          : "Flat discounts cannot be negative.",
      );
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch(
        mode === "edit"
          ? `/api/admin/discount-groups/${group?.id}`
          : "/api/admin/discount-groups",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json().catch(() => null)) as {
        group?: DiscountGroupDetails;
        message?: string;
      } | null;
      if (!response.ok || !data?.group) {
        setError(data?.message ?? "Unable to save discount group.");
        return;
      }
      toast.success(
        mode === "edit" ? "Discount group updated" : "Discount group created",
      );
      router.push(`/admin/settings/discount-groups/${data.group.id}`);
    } catch {
      setError("Unable to save discount group right now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={save}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild type="button" variant="outline">
          <Link href="/admin/settings/discount-groups">
            <ArrowLeft /> Discount Groups
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button asChild type="button" variant="outline">
            <Link href="/admin/settings/discount-groups">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            <Save /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {error ? (
        <p
          className="rounded border border-red-100 bg-red-50 px-3 py-2 text-[12px] text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px]">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#31405A]">
              Discount Group Name
            </span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              required
              placeholder="Standard Store Discount"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#31405A]">
              Description
            </span>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              placeholder="Service-wise store discounts"
            />
          </label>
          <div className="flex items-center gap-2 self-end pb-2">
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              aria-label="Discount group active"
            />
            <span className="text-xs font-medium text-[#31405A]">
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-[#E7EDF5] px-4 py-3">
            <h2 className="text-sm font-semibold text-[#071333]">
              Service Discounts
            </h2>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[620px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Discount Type</TableHead>
                  <TableHead className="w-[180px]">Discount Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.length ? (
                  rules.map((rule) => {
                    const service = serviceById.get(rule.serviceId);
                    return (
                      <TableRow key={rule.serviceId}>
                        <TableCell className="font-medium text-[#071333]">
                          {service?.name ?? "Unknown service"}
                        </TableCell>
                        <TableCell>
                          {service?.isActive ? "Active" : "Inactive"}
                        </TableCell>
                        <TableCell>
                          <MuiSelect
                            aria-label={`${service?.name ?? "Service"} discount type`}
                            value={rule.discountType}
                            onChange={(event) =>
                              updateRule(rule.serviceId, {
                                discountType: event.target
                                  .value as DiscountType,
                              })
                            }
                            className="h-9 w-[150px] rounded border border-[#DCE6F2] bg-white px-2 text-[12px] text-[#071333] outline-none focus:border-[#075DFF]"
                          >
                            <option value="Percentage">Percentage</option>
                            <option value="Flat">Flat Amount</option>
                          </MuiSelect>
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <Input
                              aria-label={`${service?.name ?? "Service"} discount value`}
                              type="number"
                              min={0}
                              max={
                                rule.discountType === "Percentage"
                                  ? 100
                                  : undefined
                              }
                              step="0.01"
                              value={rule.discountValue}
                              onChange={(event) =>
                                updateRule(rule.serviceId, {
                                  discountValue: event.target.value,
                                })
                              }
                              className="pr-9 shadow-none"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#71809A]">
                              {rule.discountType === "Percentage" ? "%" : "₹"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-[#71809A]"
                    >
                      No services found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
