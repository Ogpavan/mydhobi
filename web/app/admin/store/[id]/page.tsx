import { notFound } from "next/navigation";

import { StoreDetailView } from "@/components/admin/store-detail-view";
import { listStoreTeamMembers } from "@/lib/store-team";
import { listSetupRoles } from "@/lib/roles";
import { getStoreById } from "@/lib/stores";

export const dynamic = "force-dynamic";

type StoreDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const { id } = await params;
  const store = await getStoreById(id);

  if (!store) {
    notFound();
  }

  const [members, roles] = await Promise.all([
    listStoreTeamMembers(id),
    listSetupRoles(),
  ]);
  return <StoreDetailView store={store} members={members} roles={roles.filter((role) => role.isActive)} />;
}
