import { Clock } from "lucide-react";

import {
  ReferenceSpriteIcon,
  type ReferenceSpriteName,
} from "@/components/admin/reference-sprite-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type OperationOrder } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type OperationCardProps = {
  title: string;
  icon: ReferenceSpriteName;
  countTone: "blue" | "green";
  orders: OperationOrder[];
};

const countToneStyles = {
  blue: "border-[#CFE0FF] bg-[#EEF5FF] text-[#075DFF]",
  green: "border-[#CDEFD5] bg-[#E9F9EC] text-[#13A33D]",
};

const statusStyles: Record<OperationOrder["status"], string> = {
  Scheduled: "border-[#D4E4FF] bg-[#EEF5FF] text-[#075DFF]",
  "Out for Delivery": "border-[#CDEFD5] bg-[#E9F9EC] text-[#13A33D]",
  Delivered: "border-[#CDEFD5] bg-[#E9F9EC] text-[#13A33D]",
};

export function OperationCard({
  title,
  icon,
  countTone,
  orders,
}: OperationCardProps) {
  return (
    <Card className="h-[246px] overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-4 p-[10px] pb-[7px]">
        <div className="flex items-center gap-[10px]">
          <ReferenceSpriteIcon name={icon} scale={0.72} />
          <CardTitle>{title}</CardTitle>
        </div>
        <div
          className={cn(
            "flex h-[28px] min-w-[38px] items-center justify-center rounded-[8px] border px-2 text-[16px] font-medium leading-none",
            countToneStyles[countTone],
          )}
        >
          {orders.length}
        </div>
      </CardHeader>
      <CardContent className="px-[16px] pb-[12px] pt-0">
        {orders.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#DCE6F2] bg-[#F7FAFF] p-6 text-center text-sm font-normal text-[#52627A]">
            No scheduled orders.
          </div>
        ) : (
          <div className="space-y-[6px]">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex h-[43px] items-center gap-[10px] rounded-[10px] border border-[#DCE6F2] bg-white px-[10px] shadow-[0_4px_14px_rgba(15,23,42,0.028)]"
              >
                <div className="h-[38px] w-[38px] overflow-hidden rounded-full">
                  <ReferenceSpriteIcon name={order.avatar} scale={0.64} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium leading-none text-[#071333]">
                    {order.customer}
                  </p>
                  <p className="mt-1 truncate text-[11px] font-normal leading-none text-[#52627A]">
                    {order.area}
                  </p>
                </div>
                <div className="hidden min-w-[76px] items-center justify-end gap-1.5 text-[12px] font-normal text-[#52627A] md:flex">
                  <Clock className="h-3.5 w-3.5 text-[#617691]" />
                  <span>{order.time}</span>
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap rounded-[8px] border px-[9px] py-[6px] text-[11px] font-medium leading-none",
                    statusStyles[order.status],
                  )}
                >
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
