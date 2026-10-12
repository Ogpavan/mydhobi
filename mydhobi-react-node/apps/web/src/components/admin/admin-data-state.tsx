import { AdminPageError, AdminPageLoading } from "./admin-page-state";
export function AdminDataState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string | null;
  retry: () => void;
}) {
  if (loading) return <AdminPageLoading />;
  if (error) return <AdminPageError message={error} retry={retry} />;
  return null;
}
