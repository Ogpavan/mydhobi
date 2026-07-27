import { notFound } from "next/navigation";

import { AdminRiderDetails } from "@/components/admin/riders-admin";
import { getRider } from "@/lib/riders";

export const dynamic = "force-dynamic";

export default async function RiderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rider = await getRider(id);
  if (!rider) notFound();
  return <AdminRiderDetails initialRider={rider} />;
}
