import { DashboardChart } from "@/components/admin/dashboard-chart";
import { OperationCard } from "@/components/admin/operation-card";
import { ReferenceSpriteIcon } from "@/components/admin/reference-sprite-icon";
import { RecentOrdersTable } from "@/components/admin/recent-orders-table";
import { StatCard } from "@/components/admin/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  orderStatusData,
  ordersOverviewData,
  recentOrders,
  todayDeliveries,
  todayPickups,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const totalStatusOrders = orderStatusData.reduce(
  (sum, item) => sum + item.value,
  0,
);

export default function DashboardPage() {
  return (
    <div className="space-y-[12px]">
      <section className="grid gap-[12px] sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="statPickups"
          iconScale={0.66}
          label="Today Pickups"
          value="24"
          trend="12%"
        />
        <StatCard
          icon="statDeliveries"
          iconScale={0.66}
          label="Today Deliveries"
          value="18"
          trend="8%"
          valueClassName="text-[#10A83B]"
        />
        <StatCard
          icon="statProcess"
          iconScale={0.66}
          label="Orders in Process"
          value="42"
          trend="5%"
          valueClassName="text-[#FF5B13]"
        />
        <StatCard
          icon="statPayments"
          iconScale={0.64}
          label="Pending Payments"
          value="₹12,450"
          trend="6%"
          trendDirection="down"
          valueClassName="text-[#6D28D9] text-[29px]"
        />
      </section>

      <section className="grid gap-[12px] xl:grid-cols-[minmax(0,1.53fr)_minmax(360px,1fr)]">
        <DashboardChart data={ordersOverviewData} />

        <Card className="h-[270px] overflow-hidden">
          <CardHeader className="flex-row items-start gap-[11px] p-[12px] pb-[6px]">
            <ReferenceSpriteIcon name="statusPie" scale={0.72} />
            <div>
              <CardTitle>Order Status</CardTitle>
              <CardDescription className="mt-1.5">
                Current operational breakdown
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-[6px] px-[18px] pb-[12px] pt-0">
            {orderStatusData.map((item) => {
              const percentage = Math.round((item.value / totalStatusOrders) * 100);

              return (
                <div key={item.label} className="grid grid-cols-[33px_1fr] items-center gap-[11px]">
                  <ReferenceSpriteIcon name={item.icon} scale={0.72} />
                  <div className="min-w-0">
                    <div className="mb-[5px] flex items-center justify-between gap-4">
                      <span className="text-[13px] font-medium leading-none text-[#071333]">
                        {item.label}
                      </span>
                      <div className="flex min-w-[64px] items-center justify-end gap-[15px]">
                        <span className="text-[14px] font-medium leading-none text-[#071333]">
                          {item.value}
                        </span>
                        <span className="text-[12px] font-normal leading-none text-[#52627A]">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-[7px] overflow-hidden rounded-full bg-[#E8EEF6]">
                      <div
                        className={cn("h-full rounded-full", item.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-[12px] xl:grid-cols-2">
        <OperationCard
          title="Today's Pickups"
          icon="pickupHeader"
          countTone="blue"
          orders={todayPickups}
        />
        <OperationCard
          title="Today's Deliveries"
          icon="deliveryHeader"
          countTone="green"
          orders={todayDeliveries}
        />
      </section>

      <RecentOrdersTable orders={recentOrders} />
    </div>
  );
}
