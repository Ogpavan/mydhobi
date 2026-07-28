"use client";

import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminPageError, AdminPageLoading } from "@/components/admin/admin-page-state";
import { DashboardChart } from "@/components/admin/dashboard-chart";
import { OperationCard } from "@/components/admin/operation-card";
import { RecentOrdersTable } from "@/components/admin/recent-orders-table";
import { ReferenceSpriteIcon } from "@/components/admin/reference-sprite-icon";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export function AdminDashboardClient() {
  const result = useAdminPageData<DashboardData>("key=dashboard", 15_000);
  if (result.loading && !result.data) return <AdminPageLoading />;
  if (result.error && !result.data) {
    return <AdminPageError message={result.error} retry={result.retry} />;
  }
  if (!result.data) return <AdminPageLoading />;

  const data = result.data;
  const totalStatusOrders = Math.max(
    1,
    data.orderStatuses.reduce((sum, item) => sum + item.value, 0),
  );

  return (
    <div className="space-y-[12px]">
      <section className="grid gap-[12px] sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="statPickups" iconScale={0.66} label="Today Pickups" value={String(data.stats.todayPickups)} trend={`${Math.abs(data.trends.pickups)}%`} trendDirection={data.trends.pickups < 0 ? "down" : "up"} />
        <StatCard icon="statDeliveries" iconScale={0.66} label="Today Deliveries" value={String(data.stats.todayDeliveries)} trend={`${Math.abs(data.trends.deliveries)}%`} trendDirection={data.trends.deliveries < 0 ? "down" : "up"} valueClassName="text-[#10A83B]" />
        <StatCard icon="statProcess" iconScale={0.66} label="Orders in Process" value={String(data.stats.ordersInProcess)} trend={`${Math.abs(data.trends.orders)}%`} trendDirection={data.trends.orders < 0 ? "down" : "up"} valueClassName="text-[#FF5B13]" />
        <StatCard icon="statPayments" iconScale={0.64} label="Pending Payments" value={`₹${data.stats.pendingPayments.toLocaleString("en-IN")}`} trend={`${Math.abs(data.trends.payments)}%`} trendDirection={data.trends.payments < 0 ? "down" : "up"} valueClassName="text-[#6D28D9] text-[29px]" />
      </section>

      <section className="grid gap-[12px] xl:grid-cols-[minmax(0,1.53fr)_minmax(360px,1fr)]">
        <DashboardChart data={data.ordersOverview} />
        <Card className="h-[270px] overflow-hidden">
          <CardHeader className="flex-row items-start gap-[11px] p-[12px] pb-[6px]">
            <ReferenceSpriteIcon name="statusPie" scale={0.72} />
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-[6px] px-[18px] pb-[12px] pt-0">
            {data.orderStatuses.map((item) => {
              const percentage = Math.round((item.value / totalStatusOrders) * 100);
              return (
                <div key={item.label} className="grid grid-cols-[33px_1fr] items-center gap-[11px]">
                  <ReferenceSpriteIcon name={item.icon} scale={0.72} />
                  <div className="min-w-0">
                    <div className="mb-[5px] flex items-center justify-between gap-4">
                      <span className="text-[13px] font-medium leading-none text-[#071333]">{item.label}</span>
                      <div className="flex min-w-[64px] items-center justify-end gap-[15px]">
                        <span className="text-[14px] font-medium leading-none text-[#071333]">{item.value}</span>
                        <span className="text-[12px] font-normal leading-none text-[#52627A]">{percentage}%</span>
                      </div>
                    </div>
                    <div className="h-[7px] overflow-hidden rounded-full bg-[#E8EEF6]">
                      <div className={cn("h-full rounded-full", item.color)} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-[12px] xl:grid-cols-2">
        <OperationCard title="Today's Pickups" icon="pickupHeader" countTone="blue" orders={data.todayPickups} />
        <OperationCard title="Today's Deliveries" icon="deliveryHeader" countTone="green" orders={data.todayDeliveries} />
      </section>

      <RecentOrdersTable orders={data.recentOrders} />
    </div>
  );
}
