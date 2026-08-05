"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  Pencil,
  Plus,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StoreTeamMember } from "@/lib/store-team";
import type { SetupRole } from "@/lib/roles";
import type { Store, StoreStatus } from "@/lib/stores";
import { cn } from "@/lib/utils";

type StoreTab = "overview" | "team";

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStoreStatusClassName(status: StoreStatus) {
  if (status === "active") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "inactive") return "border-slate-200 bg-slate-50 text-slate-600";
  return "border-amber-100 bg-amber-50 text-amber-700";
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 border-b border-[#E7EDF5] py-3.5 sm:px-2 first:sm:pl-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#6B7B93]">
        {label}
      </p>
      <p className="mt-1.5 break-words text-[13px] font-medium leading-5 text-[#071333]">
        {value || "Not set"}
      </p>
    </div>
  );
}

function AddMemberDialog({
  open,
  onOpenChange,
  storeId,
  roles,
  member,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  roles: SetupRole[];
  member?: StoreTeamMember;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState(member?.role ?? roles[0]?.name.toLowerCase() ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      mobile: String(formData.get("mobile") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? "").trim().toLowerCase(),
      status: "active",
      password: String(formData.get("password") ?? ""),
    };

    try {
      const response = await fetch(`/api/stores/${storeId}/team`, {
        method: member ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member ? { ...payload, memberId: member.id } : payload),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "Unable to add team member.");
        return;
      }

      form.reset();
      onOpenChange(false);
      toast.success(member ? "Team member updated" : "Team member added");
      router.refresh();
    } catch {
      setError("Unable to add team member right now.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setError("");
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#31405A]">
              Full name <span className="text-red-500">*</span>
            </span>
            <Input name="name" defaultValue={member?.name} required maxLength={100} autoFocus />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#31405A]">
              Mobile number <span className="text-red-500">*</span>
            </span>
            <Input
              name="mobile"
              defaultValue={member?.mobile}
              required
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              title="Enter a 10-digit mobile number."
              onInput={(event) => {
                event.currentTarget.value = event.currentTarget.value
                  .replace(/\D/g, "")
                  .slice(0, 10);
                event.currentTarget.setCustomValidity("");
              }}
              onInvalid={(event) => {
                event.currentTarget.setCustomValidity(
                  "Enter a 10-digit mobile number.",
                );
              }}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#31405A]">Email</span>
            <Input name="email" defaultValue={member?.email} type="email" />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#31405A]">
              Role <span className="text-red-500">*</span>
            </span>
            <select
              name="role"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              className="h-9 w-full rounded border border-[#DCE6F2] bg-white px-3 text-sm text-[#071333] outline-none focus:border-[#075DFF] focus:ring-1 focus:ring-[#075DFF]/20"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.name.toLowerCase()}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>

          {(selectedRole === "manager" || selectedRole === "store_manager") ? (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#31405A]">
                {member?.userId ? "New password (optional)" : "Login password"}
                {!member?.userId ? <span className="text-red-500"> *</span> : null}
              </span>
              <Input
                name="password"
                type="password"
                minLength={member?.userId ? 0 : 8}
                required={!member?.userId}
                autoComplete="new-password"
                placeholder={member?.userId ? "Leave blank to keep current password" : "At least 8 characters"}
              />
              <p className="text-[11px] text-[#52627A]">
                The manager signs in with this mobile number and password.
              </p>
            </label>
          ) : null}

          {error ? (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-[#E7EDF5] pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : member ? "Save Member" : "Add Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OverviewTab({ store }: { store: Store }) {
  const address = [
    store.addressLine1,
    store.addressLine2,
    store.landmark,
    store.city,
    store.state,
    store.pinCode,
  ].filter(Boolean).join(", ");

  return (
    <div className="divide-y divide-[#E7EDF5]">
      <section className="px-4 py-2 sm:px-5">
        <h3 className="pt-2 text-sm font-medium text-[#071333]">Store Details</h3>
        <div className="mt-1 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Company" value={store.company} />
          <DetailItem label="Email" value={store.email} />
          <DetailItem label="Mobile number" value={store.mobile} />
          <DetailItem label="Process time" value={store.processTime} />
          <DetailItem
            label="Delivery time"
            value={store.tagDeliveryDateInterval}
          />
          <DetailItem label="Address" value={address} />
        </div>
      </section>

      <section className="px-4 py-2 sm:px-5">
        <h3 className="pt-2 text-sm font-medium text-[#071333]">Invoice</h3>
        <div className="mt-1 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Name on invoice" value={store.invoiceGenName} />
          <DetailItem label="Starting number" value={store.invoiceGenNumber} />
          <DetailItem label="UPI ID" value={store.upiAccountId} />
        </div>
      </section>
    </div>
  );
}

function TeamTab({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onToggleMember,
}: {
  members: StoreTeamMember[];
  onAddMember: () => void;
  onEditMember: (member: StoreTeamMember) => void;
  onDeleteMember: (member: StoreTeamMember) => void;
  onToggleMember: (member: StoreTeamMember) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-[#E7EDF5] px-4 py-3 sm:px-5">
        <p className="text-sm font-medium text-[#071333]">
          {members.length} {members.length === 1 ? "member" : "members"}
        </p>
        <Button onClick={onAddMember} className="h-[34px] bg-[#075DFF] hover:bg-[#064FEB]">
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-4 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF5FF] text-[#075DFF]">
            <UsersRound className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-[#071333]">No team members</p>
          <Button onClick={onAddMember} variant="outline" className="mt-4">
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Member</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[128px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF5FF] text-[#075DFF]">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-[#071333]">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-normal text-[#31405A]">{member.mobile}</TableCell>
                    <TableCell className="font-normal text-[#52627A]">{member.email || "Not set"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-blue-100 bg-blue-50 text-blue-700">
                        {titleCase(member.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={member.status === "active"} onCheckedChange={() => onToggleMember(member)} aria-label={`Mark ${member.name} ${member.status === "active" ? "disabled" : "active"}`} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditMember(member)}
                        aria-label={`Edit ${member.name}`}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => onDeleteMember(member)} aria-label={`Delete ${member.name}`}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y divide-[#E7EDF5] md:hidden">
            {members.map((member) => (
              <div key={member.id} className="flex gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-[#075DFF]">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#071333]">{member.name}</p>
                  <p className="mt-1 text-sm text-[#52627A]">{member.mobile}</p>
                  {member.email ? (
                    <p className="truncate text-xs text-[#52627A]">{member.email}</p>
                  ) : null}
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="border-blue-100 bg-blue-50 text-blue-700">
                      {titleCase(member.role)}
                    </Badge>
                    <Switch checked={member.status === "active"} onCheckedChange={() => onToggleMember(member)} aria-label={`Mark ${member.name} ${member.status === "active" ? "disabled" : "active"}`} />
                  </div>
                  <div className="mt-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditMember(member)}
                      aria-label={`Edit ${member.name}`}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => onDeleteMember(member)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function StoreDetailView({
  store,
  members,
  roles,
}: {
  store: Store;
  members: StoreTeamMember[];
  roles: SetupRole[];
}) {
  const [tab, setTab] = useState<StoreTab>("overview");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StoreTeamMember>();
  const [teamMembers, setTeamMembers] = useState(members);
  const updateMember = async (member: StoreTeamMember, body: object) => {
    const response = await fetch(`/api/stores/${store.id}/team`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId: member.id, ...body }) });
    const data = await response.json() as { member?: StoreTeamMember; message?: string };
    if (!response.ok || !data.member) { toast.error(data.message ?? "Unable to update team member."); return; }
    setTeamMembers((current) => current.map((item) => item.id === member.id ? data.member! : item));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Image src="/sidebar/store-icon.png" alt="" width={48} height={44} className="h-11 w-12 shrink-0 object-contain" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-medium text-[#071333]">{store.name}</h2>
              <Badge variant="outline" className={getStoreStatusClassName(store.status)}>
                {titleCase(store.status)}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-[#52627A]">{store.storeCode}</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/admin/store/${store.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Edit Store
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex border-b border-[#DCE6F2] px-2" role="tablist" aria-label="Store sections">
          {([
            ["overview", "Overview"],
            ["team", `Team (${members.length})`],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                "relative h-11 px-4 text-sm font-medium transition-colors",
                tab === value
                  ? "text-[#075DFF] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-[#075DFF]"
                  : "text-[#52627A] hover:text-[#071333]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <CardContent className="p-0">
          {tab === "overview" ? (
            <OverviewTab store={store} />
          ) : (
            <TeamTab members={teamMembers} onAddMember={() => { setEditingMember(undefined); setAddMemberOpen(true); }} onEditMember={(member) => { setEditingMember(member); setAddMemberOpen(true); }} onToggleMember={(member) => void updateMember(member, { status: member.status === "active" ? "disabled" : "active" })} onDeleteMember={async (member) => { if (!window.confirm(`Delete ${member.name}?`)) return; const response = await fetch(`/api/stores/${store.id}/team?memberId=${member.id}`, { method: "DELETE" }); if (response.ok) setTeamMembers((current) => current.filter((item) => item.id !== member.id)); else toast.error("Unable to delete team member."); }} />
          )}
        </CardContent>
      </Card>

      <AddMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        storeId={store.id}
        roles={roles}
        member={editingMember}
      />
    </div>
  );
}
