import { Suspense } from "react";

import { CustomerOrderSuccessClient } from "@/components/customer/customer-client-pages";
import { CustomerPageSkeleton } from "@/components/customer/customer-page-state";

export default function OrderSuccessPage() {
  return <Suspense fallback={<CustomerPageSkeleton rows={3} />}><CustomerOrderSuccessClient /></Suspense>;
}
