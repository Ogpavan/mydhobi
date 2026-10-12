import { useCustomerData } from "@/components/customer/customer-client-data";
import {
  CustomerPageError,
  CustomerPageSkeleton,
} from "@/components/customer/customer-page-state";
import { ProfileView } from "@/components/customer/profile-view";
import type { AuthUser } from "@/lib/auth";
type UserResponse = { user: AuthUser };
export function CustomerProfileClient() {
  const user = useCustomerData<UserResponse>("/api/auth/me", 60_000);
  if (user.loading) return <CustomerPageSkeleton variant="form" rows={6} />;
  if (user.error)
    return <CustomerPageError message={user.error} retry={user.retry} />;
  return user.data ? (
    <ProfileView user={user.data.user} />
  ) : (
    <CustomerPageSkeleton variant="form" />
  );
}
