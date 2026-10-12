import { MuiSelect } from "@/components/ui/native-controls";
import { apiFetch } from "@/platform/http";
import Link from "@/platform/navigation";
import { toast } from "@/platform/notifications";
import { Pagination } from "@mui/material";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DiscountGroup } from "@/lib/discount-groups";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function DiscountGroupsAdmin({
  initialGroups,
}: {
  initialGroups: DiscountGroup[];
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const filteredGroups = useMemo(() => {
    const search = query.trim().toLowerCase();
    return groups.filter((group) => {
      const matchesSearch =
        !search ||
        `${group.name} ${group.description}`.toLowerCase().includes(search);
      return (
        matchesSearch &&
        (status === "all" || group.isActive === (status === "active"))
      );
    });
  }, [groups, query, status]);
  const pageCount = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const visibleGroups = filteredGroups.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => setPage(1), [query, status]);
  useEffect(
    () => setPage((current) => Math.min(current, pageCount)),
    [pageCount],
  );

  async function remove(group: DiscountGroup) {
    if (
      !window.confirm(
        `Delete ${group.name}? Assigned stores will be unassigned.`,
      )
    )
      return;
    const response = await apiFetch(`/api/admin/discount-groups/${group.id}`, {
      method: "DELETE",
    });
    const data = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    if (!response.ok) {
      toast.error(data?.message ?? "Unable to delete discount group.");
      return;
    }
    setGroups((current) => current.filter((item) => item.id !== group.id));
    toast.success("Discount group deleted");
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
          <div className="relative min-w-0 max-w-[420px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71809A]" />
            <Input
              aria-label="Search discount groups"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search discount groups"
              className="pl-9 shadow-none"
            />
          </div>
          <MuiSelect
            aria-label="Filter discount groups by status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "all" | "active" | "inactive")
            }
            className="h-9 w-[126px] rounded border border-[#DCE6F2] bg-white px-2 text-[12px] text-[#071333] outline-none focus:border-[#075DFF]"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </MuiSelect>
          <Button asChild className="ml-auto shrink-0">
            <Link href="/admin/settings/discount-groups/new">
              <Plus /> Add group
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Stores Assigned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleGroups.length ? (
                  visibleGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>
                        <p className="font-medium text-[#071333]">
                          {group.name}
                        </p>
                        {group.description ? (
                          <p className="mt-0.5 max-w-[260px] truncate text-[11px] text-[#71809A]">
                            {group.description}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>{group.serviceCount}</TableCell>
                      <TableCell>{group.storeCount}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            group.isActive
                              ? "bg-[#E9F8EF] text-[#15803D]"
                              : "bg-[#F1F3F6] text-[#64748B]"
                          }
                        >
                          {group.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[#52627A]">
                        {formatDate(group.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            title="View"
                          >
                            <Link
                              href={`/admin/settings/discount-groups/${group.id}`}
                            >
                              <Eye /> View
                            </Link>
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            title="Edit"
                          >
                            <Link
                              href={`/admin/settings/discount-groups/${group.id}/edit`}
                            >
                              <Pencil /> Edit
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[#DC2626] hover:bg-[#FFF1F2] hover:text-[#B91C1C]"
                            title="Delete"
                            onClick={() => void remove(group)}
                          >
                            <Trash2 /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-[#71809A]"
                    >
                      No discount groups found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {filteredGroups.length > pageSize ? (
            <div className="flex items-center justify-between gap-3 border-t border-[#E7EDF5] px-4 py-3">
              <span className="text-[11px] text-[#71809A]">
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, filteredGroups.length)} of{" "}
                {filteredGroups.length}
              </span>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(_, value) => setPage(value)}
                size="small"
                color="primary"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
