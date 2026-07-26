import type { Metadata } from "next";

import { ReferEarnView } from "@/components/customer/refer-earn-view";

export const metadata: Metadata = { title: { absolute: "Refer & Earn | MyDhobi" } };

export default function ReferEarnPage() {
  return <ReferEarnView />;
}
