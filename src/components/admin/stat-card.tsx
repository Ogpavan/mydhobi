"use client";

import { Card } from "@/components/ui/card";
import { IconByName } from "@/components/laundry/icon-map";

export function StatCard({ label, value, helper, icon, tone = "primary" }: { label: string; value: string; helper?: string; icon: string; tone?: "primary" | "accent" | "sky" | "emerald" }) {
  const toneClass = {
    primary: "bg-primary text-primary-foreground",
    accent: "bg-orange-100 text-orange-700",
    sky: "bg-sky-100 text-sky-700",
    emerald: "bg-emerald-100 text-emerald-700",
  }[tone];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-extrabold text-foreground">{value}</p>
          {helper && <p className="mt-2 text-xs font-semibold text-muted-foreground">{helper}</p>}
        </div>
        <span className={`grid size-12 place-items-center rounded-md ${toneClass}`}>
          <IconByName name={icon} />
        </span>
      </div>
    </Card>
  );
}
