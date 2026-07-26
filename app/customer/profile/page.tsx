import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileView } from "@/components/customer/profile-view";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: { absolute: "My Profile | MyDhobi" } };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return <ProfileView user={user} />;
}
