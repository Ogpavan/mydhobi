import { notFound } from "next/navigation";

import { StoreForm } from "@/components/admin/store-form";
import { getStoreById } from "@/lib/stores";

export const dynamic = "force-dynamic";

type EditStorePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditStorePage({ params }: EditStorePageProps) {
  const { id } = await params;
  const store = await getStoreById(id);

  if (!store) {
    notFound();
  }

  return <StoreForm mode="edit" store={store} />;
}
