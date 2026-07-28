"use client";

import { Suspense } from "react";

import { AdminPageLoading } from "@/components/admin/admin-page-state";
import { AdminSearchClient } from "@/components/admin/admin-search-client";

export default function AdminSearchPage() {
  return (
    <Suspense fallback={<AdminPageLoading />}>
      <AdminSearchClient />
    </Suspense>
  );
}
