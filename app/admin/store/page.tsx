import Link from "next/link";
import { Mail, Plus, Smartphone } from "lucide-react";

import { StoreActionsMenu } from "@/components/admin/store-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listStores, type StoreStatus } from "@/lib/stores";

export const dynamic = "force-dynamic";

function getStatusLabel(status: StoreStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusClassName(status: StoreStatus) {
  if (status === "active") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (status === "inactive") {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  return "border-amber-100 bg-amber-50 text-amber-700";
}

function getLocation(city: string, state: string) {
  return [city, state].filter(Boolean).join(", ") || "Not set";
}

export default async function StorePage() {
  const stores = await listStores();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 p-5 pb-3">
          <div>
            <CardTitle>Stores</CardTitle>
            <CardDescription>Company, contact, and processing overview.</CardDescription>
          </div>
          <Button
            asChild
            className="h-[34px] rounded bg-[#075DFF] px-3 text-[13px] font-medium shadow-[0_8px_18px_rgba(7,93,255,0.22)] hover:bg-[#064FEB]"
          >
            <Link href="/admin/store/create">
              <Plus className="h-4 w-4" />
              Create Store
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Process Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[72px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-sm font-normal text-slate-500"
                  >
                    No stores found.
                  </TableCell>
                </TableRow>
              ) : (
                stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src="/sidebar/store-icon.png"
                          alt=""
                          className="h-9 w-10 object-contain"
                        />
                        <div>
                          <p className="font-medium text-[#071333]">{store.name}</p>
                          <p className="mt-0.5 text-xs font-normal text-[#52627A]">
                            {store.storeCode}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-normal text-slate-700">
                      {store.company || "Not set"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm font-normal text-slate-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {store.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                          {store.mobile}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-normal text-slate-600">
                      {getLocation(store.city, store.state)}
                    </TableCell>
                    <TableCell className="font-normal text-slate-600">
                      {store.processTime || "Not set"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusClassName(store.status)}
                      >
                        {getStatusLabel(store.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <StoreActionsMenu
                        storeId={store.id}
                        storeName={store.name}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
