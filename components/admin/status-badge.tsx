import { Badge } from "@/components/ui/badge";
import { type OrderStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const statusStyles: Record<OrderStatus, string> = {
  New: "border-blue-100 bg-blue-50 text-blue-700",
  "Picked Up": "border-cyan-100 bg-cyan-50 text-cyan-700",
  "In Cleaning": "border-amber-100 bg-amber-50 text-amber-700",
  Ready: "border-teal-100 bg-teal-50 text-teal-700",
  Delivered: "border-emerald-100 bg-emerald-50 text-emerald-700",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap px-2.5 py-1", statusStyles[status])}
    >
      {status}
    </Badge>
  );
}
