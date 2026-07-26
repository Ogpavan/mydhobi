import { SidebarSettingsView } from "@/components/developer/sidebar-settings-view";
import { listSidebarSettings } from "@/lib/sidebar-settings";

export const dynamic = "force-dynamic";

export default async function DeveloperPage() {
  return <SidebarSettingsView initialItems={await listSidebarSettings()} />;
}
