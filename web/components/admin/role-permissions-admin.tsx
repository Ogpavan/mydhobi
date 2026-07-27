"use client";

import { Check, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  PermissionGroup,
  PermissionPage,
} from "@/lib/role-permissions";
import type { SetupRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

type RolePermissionsAdminProps = {
  roles: SetupRole[];
  groups: PermissionGroup[];
  initialAssignments: Record<string, string[]>;
};

export function RolePermissionsAdmin({
  roles,
  groups,
  initialAssignments,
}: RolePermissionsAdminProps) {
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? "");
  const [assignments, setAssignments] = useState(initialAssignments);
  const [savedAssignments, setSavedAssignments] = useState(initialAssignments);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const allPageKeys = useMemo(
    () => groups.flatMap((group) => group.pages.map((page) => page.key)),
    [groups],
  );
  const selectedKeys = assignments[selectedRoleId] ?? [];
  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const hasChanges =
    JSON.stringify([...selectedKeys].sort()) !==
    JSON.stringify([...(savedAssignments[selectedRoleId] ?? [])].sort());
  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return groups;

    return groups
      .map((group) => ({
        ...group,
        pages: group.pages.filter((page) =>
          page.label.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.pages.length > 0);
  }, [groups, search]);

  function setSelectedKeys(pageKeys: string[]) {
    setAssignments((current) => ({
      ...current,
      [selectedRoleId]: allPageKeys.filter((key) => pageKeys.includes(key)),
    }));
  }

  function togglePage(page: PermissionPage) {
    setSelectedKeys(
      selectedKeys.includes(page.key)
        ? selectedKeys.filter((key) => key !== page.key)
        : [...selectedKeys, page.key],
    );
  }

  function toggleGroup(group: PermissionGroup) {
    const groupKeys = group.pages.map((page) => page.key);
    const allSelected = groupKeys.every((key) => selectedKeys.includes(key));

    setSelectedKeys(
      allSelected
        ? selectedKeys.filter((key) => !groupKeys.includes(key))
        : [...new Set([...selectedKeys, ...groupKeys])],
    );
  }

  async function savePermissions() {
    if (!selectedRoleId) return;
    setSaving(true);

    try {
      const response = await fetch(
        `/api/settings/role-permissions/${selectedRoleId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageKeys: selectedKeys }),
        },
      );
      const data = (await response.json()) as {
        pageKeys?: string[];
        message?: string;
      };

      if (!response.ok || !data.pageKeys) {
        toast.error(data.message ?? "Unable to save page access.");
        return;
      }

      setAssignments((current) => ({
        ...current,
        [selectedRoleId]: data.pageKeys!,
      }));
      setSavedAssignments((current) => ({
        ...current,
        [selectedRoleId]: data.pageKeys!,
      }));
      toast.success("Page access saved");
    } catch {
      toast.error("Unable to save page access right now.");
    } finally {
      setSaving(false);
    }
  }

  if (roles.length === 0) {
    return (
      <div className="py-3">
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded border border-[#DCE6F2] bg-white px-5 text-center">
          <ShieldCheck className="h-10 w-10 text-[#8AA0BD]" />
          <p className="mt-3 text-sm font-medium text-[#071333]">No roles yet</p>
          <Button asChild variant="outline" className="mt-4 h-9">
            <Link href="/admin/settings/basic-setup">Add a role</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3">
      <div className="overflow-hidden rounded border border-[#DCE6F2] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#DCE6F2] px-4 py-3 sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-3">
            <span className="shrink-0 text-xs font-medium text-[#385071]">
              Role
            </span>
            <select
              value={selectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              className="h-9 min-w-0 flex-1 rounded border border-[#DCE6F2] bg-white px-3 text-sm text-[#071333] outline-none focus:border-[#075DFF] focus:ring-2 focus:ring-[#DCE7FF] sm:max-w-[280px]"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                  {role.isActive ? "" : " (Inactive)"}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-xs text-[#52627A]">
              {selectedKeys.length} of {allPageKeys.length} pages
            </span>
            <Button
              type="button"
              onClick={() => void savePermissions()}
              disabled={!hasChanges || saving}
              className="h-9 min-w-[112px] bg-[#075DFF] text-white hover:bg-[#064FD8]"
            >
              {saving ? "Saving..." : "Save Access"}
            </Button>
          </div>
        </div>

        <div className="grid min-h-[520px] md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="border-b border-[#DCE6F2] bg-[#FAFCFF] md:border-b-0 md:border-r">
            <div className="px-3 py-2">
              {roles.map((role) => {
                const roleKeys = assignments[role.id] ?? [];
                const roleHasChanges =
                  JSON.stringify([...roleKeys].sort()) !==
                  JSON.stringify([...(savedAssignments[role.id] ?? [])].sort());

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-2 rounded px-3 py-2 text-left transition-colors",
                      selectedRoleId === role.id
                        ? "bg-[#EAF2FF] text-[#075DFF]"
                        : "text-[#071333] hover:bg-[#F1F6FD]",
                    )}
                  >
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {role.name}
                      </span>
                      <span className="block text-[11px] text-[#60718D]">
                        {roleKeys.length} pages
                      </span>
                    </span>
                    {roleHasChanges ? (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
                        aria-label="Unsaved changes"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="flex flex-col gap-3 border-b border-[#E6EDF5] px-4 py-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#60718D]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search pages"
                  className="h-9 border-[#DCE6F2] pl-9 text-sm sm:max-w-[320px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedKeys(allPageKeys)}
                  disabled={selectedKeys.length === allPageKeys.length}
                  className="h-8 border-[#DCE6F2] px-3 text-xs"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedKeys([])}
                  disabled={selectedKeys.length === 0}
                  className="h-8 border-[#DCE6F2] px-3 text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="divide-y divide-[#E6EDF5]">
              {filteredGroups.map((group) => {
                const groupSelected = group.pages.filter((page) =>
                  selectedKeys.includes(page.key),
                ).length;
                const allGroupSelected = groupSelected === group.pages.length;

                return (
                  <div key={group.label} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className="flex min-w-0 items-center gap-2 text-left"
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                            allGroupSelected
                              ? "border-[#075DFF] bg-[#075DFF] text-white"
                              : "border-[#B9C8DA] bg-white text-transparent",
                          )}
                          aria-hidden="true"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate text-sm font-medium text-[#071333]">
                          {group.label}
                        </span>
                      </button>
                      <Badge
                        variant="secondary"
                        className="shrink-0 bg-[#F1F5F9] text-[11px] font-normal text-[#52627A]"
                      >
                        {groupSelected}/{group.pages.length}
                      </Badge>
                    </div>

                    <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {group.pages.map((page) => {
                        const checked = selectedKeys.includes(page.key);

                        return (
                          <label
                            key={page.key}
                            className={cn(
                              "flex min-h-10 cursor-pointer items-center gap-3 rounded border px-3 py-2 transition-colors",
                              checked
                                ? "border-[#BFD3FF] bg-[#F3F7FF]"
                                : "border-[#E2EAF3] bg-white hover:bg-[#F8FAFD]",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePage(page)}
                              className="h-4 w-4 shrink-0 accent-[#075DFF]"
                            />
                            <span className="text-sm text-[#17233F]">
                              {page.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredGroups.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-[#60718D]">
                  No matching pages
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {hasChanges && selectedRole ? (
        <div className="sticky bottom-3 mt-3 flex items-center justify-between gap-3 rounded border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
          <p className="text-xs text-amber-900">
            Unsaved changes for {selectedRole.name}
          </p>
          <Button
            type="button"
            onClick={() => void savePermissions()}
            disabled={saving}
            className="h-8 bg-[#075DFF] px-4 text-xs text-white hover:bg-[#064FD8]"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
