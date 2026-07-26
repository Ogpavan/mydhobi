import Link from "next/link";
import Image from "next/image";
import { Mail, Plus, Smartphone } from "lucide-react";

import { StoreActionsMenu } from "@/components/admin/store-actions-menu";
import { StoreStatusToggle } from "@/components/admin/store-status-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { listStores } from "@/lib/stores";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const stores = await listStores();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 p-5 pb-3">
          <CardTitle>Stores</CardTitle>
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
                    colSpan={6}
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
                        <Image
                          src="/sidebar/store-icon.png"
                          alt=""
                          width={40}
                          height={36}
                          className="h-9 w-10 object-contain"
                        />
                        <div>
                          <p className="font-medium text-[#071333]">{store.name}</p>
                          <p className="mt-0.5 text-xs font-normal text-[#52627A]">
                            {store.company || "No company"}
                          </p>
                        </div>
                      </div>
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
                      <p className="font-normal text-slate-700">{store.city || "Not set"}</p>
                      <p className="mt-0.5 text-xs text-[#52627A]">{store.state || "State not set"}</p>
                    </TableCell>
                    <TableCell className="font-normal text-slate-600">
                      {store.processTime || "Not set"}
                    </TableCell>
                    <TableCell>
                      <StoreStatusToggle storeId={store.id} status={store.status} />
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
