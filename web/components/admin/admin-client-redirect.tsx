"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AdminPageLoading } from "@/components/admin/admin-page-state";
import { startNavigationProgress } from "@/components/navigation-loader";

export function AdminClientRedirect({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    startNavigationProgress();
    router.replace(href);
  }, [href, router]);

  return <AdminPageLoading />;
}
