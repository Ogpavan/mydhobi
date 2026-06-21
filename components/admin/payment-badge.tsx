import { Badge } from "@/components/ui/badge";
import { type PaymentStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const paymentStyles: Record<PaymentStatus, string> = {
  Paid: "border-emerald-100 bg-emerald-50 text-emerald-700",
  Unpaid: "border-red-100 bg-red-50 text-red-700",
  Partial: "border-orange-100 bg-orange-50 text-orange-700",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap px-2.5 py-1", paymentStyles[status])}
    >
      {status}
    </Badge>
  );
}
