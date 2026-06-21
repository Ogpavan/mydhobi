"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StoreActionsMenu({
  storeId,
  storeName,
}: {
  storeId: string;
  storeName: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete ${storeName}?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(data.message ?? "Unable to delete store");
        return;
      }

      toast.success("Store deleted");
      router.refresh();
    } catch {
      toast.error("Unable to delete store right now");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Open actions for ${storeName}`}
          className="h-8 w-8 rounded text-slate-500 hover:text-slate-900"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        <DropdownMenuItem asChild>
          <Link href={`/admin/store/${storeId}/edit`} className="gap-2">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isDeleting}
          onSelect={(event) => {
            event.preventDefault();
            void handleDelete();
          }}
          className="gap-2 text-red-600 focus:text-red-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {isDeleting ? "Deleting..." : "Delete"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
