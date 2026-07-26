import { AdminRiders } from "@/components/admin/riders-admin";
import { listRiders } from "@/lib/riders";

export const dynamic = "force-dynamic";

export default async function RidersPage() {
  return <AdminRiders initialRiders={await listRiders()} />;
}
