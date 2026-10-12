import Link from "@/platform/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DiscountGroupDetails } from "@/lib/discount-groups";

export function DiscountGroupDetail({
  group,
}: {
  group: DiscountGroupDetails;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="outline">
          <Link href="/admin/settings/discount-groups">
            <ArrowLeft /> Discount Groups
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/admin/settings/discount-groups/${group.id}/edit`}>
            <Pencil /> Edit
          </Link>
        </Button>
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4">
          <div>
            <h2 className="text-base font-semibold text-[#071333]">
              {group.name}
            </h2>
            {group.description ? (
              <p className="mt-1 text-[12px] text-[#52627A]">
                {group.description}
              </p>
            ) : null}
          </div>
          <Badge
            className={
              group.isActive
                ? "bg-[#E9F8EF] text-[#15803D]"
                : "bg-[#F1F3F6] text-[#64748B]"
            }
          >
            {group.isActive ? "Active" : "Inactive"}
          </Badge>
        </CardContent>
      </Card>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-[#E7EDF5] px-4 py-3">
              <h2 className="text-sm font-semibold text-[#071333]">
                Service Discounts
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.rules.length ? (
                    group.rules.map((rule) => (
                      <TableRow key={rule.serviceId}>
                        <TableCell className="font-medium">
                          {rule.serviceName}
                        </TableCell>
                        <TableCell>
                          {rule.discountType === "Percentage"
                            ? "Percentage"
                            : "Flat Amount"}
                        </TableCell>
                        <TableCell className="text-right">
                          {rule.discountType === "Percentage"
                            ? `${rule.discountValue}%`
                            : `₹${rule.discountValue}`}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-24 text-center text-[#71809A]"
                      >
                        No service discounts configured.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-[#E7EDF5] px-4 py-3">
              <h2 className="text-sm font-semibold text-[#071333]">
                Assigned Stores ({group.stores.length})
              </h2>
            </div>
            {group.stores.length ? (
              <div className="divide-y divide-[#E7EDF5]">
                {group.stores.map((store) => (
                  <div
                    key={store.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-[#071333]">
                        {store.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#71809A]">
                        {store.storeCode}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {store.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-10 text-center text-[12px] text-[#71809A]">
                No stores assigned.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
