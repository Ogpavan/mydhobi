import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { listAdminOrders } from "@/lib/admin-orders";
import { listCustomers } from "@/lib/customers";
import { listRiders } from "@/lib/riders";
import { listCatalogServices } from "@/lib/service-catalog";

export const dynamic = "force-dynamic";

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q?.trim().toLowerCase() ?? "";
  const [orders, customers, riders, services] = await Promise.all([
    listAdminOrders(),
    listCustomers(),
    listRiders(),
    listCatalogServices(),
  ]);
  const includes = (value: string) => value.toLowerCase().includes(query);
  const results = query
    ? [
        ...orders.filter((item) => includes(`${item.id} ${item.customerName} ${item.customerMobile}`)).slice(0, 10).map((item) => ({ id: `order-${item.id}`, label: item.id, detail: `${item.customerName} · ${item.status}`, type: "Order", href: `/admin/orders/${item.id}` })),
        ...customers.filter((item) => includes(`${item.fullName} ${item.mobile} ${item.id}`)).slice(0, 10).map((item) => ({ id: `customer-${item.id}`, label: item.fullName, detail: `${item.mobile} · Customer #${item.id}`, type: "Customer", href: "/admin/customers" })),
        ...riders.filter((item) => includes(`${item.name} ${item.mobile} ${item.area}`)).slice(0, 10).map((item) => ({ id: `rider-${item.id}`, label: item.name, detail: `${item.mobile} · ${item.status}`, type: "Rider", href: `/admin/riders/${item.id}` })),
        ...services.filter((item) => includes(`${item.name} ${item.categoryName}`)).slice(0, 10).map((item) => ({ id: `service-${item.id}`, label: item.name, detail: `${item.categoryName} · ₹${item.regularPrice}/${item.unit}`, type: "Service", href: "/admin/services" })),
      ]
    : [];
  return (
    <div className="space-y-2">
      {!query ? <p className="rounded border border-dashed border-[#DCE6F2] bg-white px-4 py-12 text-center text-[13px] text-[#52627A]">Enter an order, customer, rider, or service in the search box.</p> : results.length ? results.map((item) => <Link key={item.id} href={item.href}><Card className="transition-colors hover:border-[#9CC1FF] hover:bg-[#F8FBFF]"><CardContent className="flex items-center gap-3 p-4"><span className="w-20 shrink-0 text-[11px] font-medium text-[#075DFF]">{item.type}</span><span className="min-w-0"><b className="block truncate text-[13px]">{item.label}</b><span className="mt-1 block truncate text-[11px] text-[#52627A]">{item.detail}</span></span></CardContent></Card></Link>) : <p className="rounded border border-dashed border-[#DCE6F2] bg-white px-4 py-12 text-center text-[13px] text-[#52627A]">No results for “{query}”.</p>}
    </div>
  );
}
