import { redirect } from "next/navigation";

import { AdminProfileForm } from "@/components/admin/admin-profile-form";
import { getCurrentUser } from "@/lib/session";

export default async function AdminProfilePage() {
  const user=await getCurrentUser();
  if(!user||user.role==="customer")redirect("/");
  return <AdminProfileForm user={user} />;
}
