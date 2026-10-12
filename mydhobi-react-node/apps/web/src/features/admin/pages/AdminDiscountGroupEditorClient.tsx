import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { DiscountGroupEditor } from "@/components/admin/discount-group-editor";
import type { DiscountGroupDetails } from "@/lib/discount-groups";
import type { ItemMasterService } from "@/lib/item-master-types";
import { useParams } from "@/platform/navigation";

export function AdminDiscountGroupEditorClient({
  mode,
}: {
  mode: "create" | "edit";
}) {
  const { id } = useParams<{ id: string }>();
  const key =
    mode === "create"
      ? "key=discount-group-create"
      : `key=discount-group-edit&id=${encodeURIComponent(id)}`;
  const result = useAdminPageData<{
    services: ItemMasterService[];
    group?: DiscountGroupDetails;
  }>(key, 30_000);
  if (!result.data) return <PageState {...result} />;
  return (
    <DiscountGroupEditor
      mode={mode}
      services={result.data.services}
      group={result.data.group}
    />
  );
}
