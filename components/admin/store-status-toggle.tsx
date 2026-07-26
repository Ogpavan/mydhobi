"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import type { StoreStatus } from "@/lib/stores";

export function StoreStatusToggle({ storeId, status }: { storeId: string; status: StoreStatus }) {
  const [active, setActive] = useState(status === "active");
  const [saving, setSaving] = useState(false);
  async function toggle() {
    const next = !active;
    setSaving(true);
    try {
      const response = await fetch(`/api/stores/${storeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next ? "active" : "inactive" }) });
      if (!response.ok) { const data = await response.json() as { message?: string }; toast.error(data.message ?? "Unable to change store status."); return; }
      setActive(next);
      toast.success(next ? "Store active" : "Store inactive");
    } catch { toast.error("Unable to change store status right now."); }
    finally { setSaving(false); }
  }
  return <Switch checked={active} disabled={saving || status === "draft"} onCheckedChange={() => void toggle()} aria-label={`${active ? "Deactivate" : "Activate"} store`} title={status === "draft" ? "Draft store" : active ? "Active" : "Inactive"} />;
}
