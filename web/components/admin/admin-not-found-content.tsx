import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AdminNotFoundContent() {
  return (
    <div className="flex min-h-[calc(100svh-98px)] items-center justify-center py-8">
      <Card className="w-full max-w-[520px]">
        <CardHeader className="items-center p-6 pb-3 text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded bg-[#EEF5FF] text-[22px] font-semibold text-[#075DFF]">
            404
          </div>
          <CardTitle>Page not found</CardTitle>
          <CardDescription className="mt-1 max-w-[360px]">
            The admin page you are looking for is unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-center gap-2 p-6 pt-2 sm:flex-row">
          <Button
            asChild
            variant="outline"
            className="h-[34px] rounded border-[#DCE6F2] bg-white px-3 text-[13px] font-medium"
          >
            <Link href="/admin/store">
              <ArrowLeft className="h-4 w-4" />
              Stores
            </Link>
          </Button>
          <Button
            asChild
            className="h-[34px] rounded bg-[#075DFF] px-3 text-[13px] font-medium shadow-[0_8px_18px_rgba(7,93,255,0.2)] hover:bg-[#064FEB]"
          >
            <Link href="/admin/dashboard">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
