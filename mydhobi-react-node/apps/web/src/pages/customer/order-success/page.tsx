import { Suspense } from "react";

import { CustomerOrderSuccessClient } from "@/features/customer/pages/CustomerOrderSuccessClient";

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CustomerOrderSuccessClient />
    </Suspense>
  );
}
