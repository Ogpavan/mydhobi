import { ArrowDown, ArrowUp } from "lucide-react";

import {
  ReferenceSpriteIcon,
  type ReferenceSpriteName,
} from "@/components/admin/reference-sprite-icon";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  trend: string;
  icon: ReferenceSpriteName;
  iconScale?: number;
  valueClassName?: string;
  trendDirection?: "up" | "down";
};

export function StatCard({
  label,
  value,
  trend,
  icon,
  iconScale = 1,
  valueClassName,
  trendDirection = "up",
}: StatCardProps) {
  const TrendIcon = trendDirection === "up" ? ArrowUp : ArrowDown;
  const trendClass = trendDirection === "up" ? "text-[#10A83B]" : "text-[#FF2037]";

  return (
    <Card className="h-[134px] overflow-hidden">
      <CardContent className="flex h-full items-center gap-[13px] p-[12px]">
        <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-visible">
          <ReferenceSpriteIcon name={icon} scale={iconScale} />
        </div>
        <div className="min-w-0 pt-1">
          <p className="text-[14px] font-medium leading-none tracking-normal text-[#071333]">
            {label}
          </p>
          <p
            className={cn(
              "mt-[10px] text-[34px] font-semibold leading-[0.85] tracking-normal text-[#075DFF]",
              valueClassName,
            )}
          >
            {value}
          </p>
          <div className={cn("mt-[9px] flex items-start gap-1", trendClass)}>
            <TrendIcon className="mt-px h-3.5 w-3.5 fill-current stroke-[3]" />
            <div>
              <p className="text-[13px] font-medium leading-none">{trend}</p>
              <p className="mt-1 text-[11px] font-normal leading-none text-[#52627A]">
                from yesterday
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
