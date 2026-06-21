"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ReferenceSpriteIcon } from "@/components/admin/reference-sprite-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardChartProps = {
  data: Array<{
    day: string;
    orders: number;
  }>;
};

export function DashboardChart({ data }: DashboardChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card className="h-[270px] overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4 p-[12px] pb-0">
        <div className="flex items-center gap-[11px]">
          <ReferenceSpriteIcon name="chartIcon" scale={0.72} />
          <div>
            <CardTitle>Orders Overview</CardTitle>
            <CardDescription className="mt-1.5">Last 7 days order volume</CardDescription>
          </div>
        </div>
        <div className="min-w-[78px] rounded-[10px] border border-[#D4E4FF] bg-[#EEF5FF] px-2 py-1.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
          <p className="text-[10px] font-medium leading-none text-[#075DFF]">
            Total Orders
          </p>
          <p className="mt-1 text-[21px] font-semibold leading-none text-[#075DFF]">
            {totalOrders}
          </p>
        </div>
      </CardHeader>
      <CardContent className="h-[210px] px-[16px] pb-[12px] pt-0">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ left: -18, right: 8, top: 16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#075DFF" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#075DFF" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#DCE6F2" strokeDasharray="4 5" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="day"
              tick={{ fill: "#263A5A", fontSize: 11, fontWeight: 700 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                domain={[0, 60]}
                ticks={[0, 15, 30, 45, 60]}
                tick={{ fill: "#263A5A", fontSize: 11, fontWeight: 700 }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ stroke: "#075DFF", strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: "14px",
                  border: "1px solid #DCE6F2",
                  boxShadow: "0 12px 36px rgba(15, 23, 42, 0.08)",
                  fontFamily: "var(--font-inter)",
                }}
                formatter={(value) => [`${value} orders`, "Orders"]}
                labelStyle={{ color: "#071333", fontWeight: 800 }}
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#075DFF"
                strokeWidth={3}
                fill="url(#ordersGradient)"
                dot={{ r: 3.5, fill: "#075DFF", stroke: "#2C7BFF", strokeWidth: 2 }}
                activeDot={{ r: 5.5, fill: "#075DFF", stroke: "#FFFFFF", strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-[12px] bg-[#F7FAFF] text-sm font-normal text-[#415172]">
            Preparing chart...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
