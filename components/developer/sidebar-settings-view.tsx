"use client";

import Image from "next/image";
import { ImagePlus, RotateCcw, Save, Sidebar as SidebarIcon } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";

import { SidebarItemIcon } from "@/components/admin/sidebar-item-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  SIDEBAR_ITEM_DEFINITIONS,
  SIDEBAR_SETTINGS_UPDATED_EVENT,
  type SidebarItemKey,
  type SidebarSetting,
} from "@/lib/sidebar-settings-types";
import { cn } from "@/lib/utils";

type IconSelection = {
  file: File;
  previewUrl: string;
};

export function SidebarSettingsView({
  initialItems,
}: {
  initialItems: SidebarSetting[];
}) {
  const [activeTab] = useState<"sidebar">("sidebar");
  const [items, setItems] = useState(initialItems);
  const [icons, setIcons] = useState<
    Partial<Record<SidebarItemKey, IconSelection>>
  >({});
  const [removedIconKeys, setRemovedIconKeys] = useState<SidebarItemKey[]>([]);
  const [errors, setErrors] = useState<Partial<Record<SidebarItemKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const fileInputs = useRef<Partial<Record<SidebarItemKey, HTMLInputElement | null>>>({});

  function updateLabel(key: SidebarItemKey, label: string) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, label } : item)),
    );
    if (label.trim() && label.trim().length <= 40) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function chooseIcon(key: SidebarItemKey, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Choose a PNG, JPG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Icon must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }

    setIcons((current) => {
      const previous = current[key];
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      return {
        ...current,
        [key]: { file, previewUrl: URL.createObjectURL(file) },
      };
    });
    setRemovedIconKeys((current) => current.filter((itemKey) => itemKey !== key));
  }

  function resetIcon(key: SidebarItemKey) {
    setIcons((current) => {
      const next = { ...current };
      const selected = next[key];
      if (selected) URL.revokeObjectURL(selected.previewUrl);
      delete next[key];
      return next;
    });
    if (fileInputs.current[key]) fileInputs.current[key]!.value = "";
    setRemovedIconKeys((current) =>
      current.includes(key) ? current : [...current, key],
    );
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<SidebarItemKey, string>> = {};

    for (const item of items) {
      const label = item.label.trim();
      if (!label) nextErrors[item.key] = "Name is required.";
      else if (label.length > 40) nextErrors[item.key] = "Use 40 characters or less.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Check the names marked in red.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      for (const item of items) {
        formData.set(`label.${item.key}`, item.label.trim());
        const selectedIcon = icons[item.key];
        if (selectedIcon) formData.set(`icon.${item.key}`, selectedIcon.file);
      }
      formData.set("removedIconKeys", JSON.stringify(removedIconKeys));

      const response = await fetch("/api/developer/sidebar", {
        method: "PUT",
        body: formData,
      });
      const data = (await response.json()) as {
        items?: SidebarSetting[];
        message?: string;
      };

      if (!response.ok || !data.items) {
        toast.error(data.message ?? "Unable to save sidebar.");
        return;
      }

      for (const selected of Object.values(icons)) {
        if (selected) URL.revokeObjectURL(selected.previewUrl);
      }
      setItems(data.items);
      setIcons({});
      setRemovedIconKeys([]);
      for (const input of Object.values(fileInputs.current)) {
        if (input) input.value = "";
      }
      window.dispatchEvent(
        new CustomEvent<SidebarSetting[]>(SIDEBAR_SETTINGS_UPDATED_EVENT, {
          detail: data.items,
        }),
      );
      toast.success("Sidebar saved");
    } catch {
      toast.error("Unable to save sidebar right now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="py-5">
      <div
        className="mb-4 flex border-b border-[#DCE6F2]"
        role="tablist"
        aria-label="Developer settings"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "sidebar"}
          className="flex h-10 items-center gap-2 border-b-2 border-[#075DFF] px-4 text-[13px] font-medium text-[#075DFF]"
        >
          <SidebarIcon className="h-4 w-4" />
          Sidebar
        </button>
      </div>

      <Card>
        <CardHeader className="border-b border-[#E4EBF3] px-5 py-4">
          <CardTitle>Sidebar items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={saveSettings}>
            <div className="divide-y divide-[#E4EBF3]">
              {items.map((item) => {
                const definition = SIDEBAR_ITEM_DEFINITIONS.find(
                  (entry) => entry.key === item.key,
                );
                const selectedIcon = icons[item.key];
                const iconWasRemoved = removedIconKeys.includes(item.key);
                const previewUrl = selectedIcon?.previewUrl ??
                  (iconWasRemoved ? null : item.iconUrl);

                return (
                  <div
                    key={item.key}
                    className="grid gap-3 px-4 py-3 sm:grid-cols-[44px_minmax(160px,1fr)_minmax(210px,1fr)] sm:items-center sm:px-5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded border border-[#DCE6F2] bg-[#F8FAFD]">
                      {previewUrl ? (
                        <Image
                          src={previewUrl}
                          alt=""
                          width={30}
                          height={30}
                          unoptimized
                          className="h-[30px] w-[30px] object-contain"
                        />
                      ) : (
                        <SidebarItemIcon itemKey={item.key} />
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={`sidebar-name-${item.key}`}
                        className="mb-1 block text-[11px] font-medium text-[#52627A]"
                      >
                        Name
                      </label>
                      <Input
                        id={`sidebar-name-${item.key}`}
                        value={item.label}
                        onChange={(event) => updateLabel(item.key, event.target.value)}
                        maxLength={40}
                        aria-invalid={Boolean(errors[item.key])}
                        className={cn(
                          "h-9 text-[13px]",
                          errors[item.key] && "border-red-500 focus-visible:border-red-500",
                        )}
                      />
                      {errors[item.key] ? (
                        <p className="mt-1 text-[11px] text-red-600">{errors[item.key]}</p>
                      ) : null}
                    </div>

                    <div>
                      <span className="mb-1 block text-[11px] font-medium text-[#52627A]">
                        Icon
                      </span>
                      <div className="flex min-w-0 gap-2">
                        <input
                          ref={(element) => {
                            fileInputs.current[item.key] = element;
                          }}
                          id={`sidebar-icon-${item.key}`}
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                          onChange={(event) => chooseIcon(item.key, event)}
                          className="sr-only"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-w-0 flex-1"
                          onClick={() => fileInputs.current[item.key]?.click()}
                        >
                          <ImagePlus />
                          <span className="truncate">
                            {selectedIcon?.file.name ?? "Choose icon"}
                          </span>
                        </Button>
                        {(item.iconUrl || selectedIcon) && !iconWasRemoved ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => resetIcon(item.key)}
                            aria-label={`Use default ${definition?.defaultLabel ?? item.label} icon`}
                            title="Use default icon"
                          >
                            <RotateCcw />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 flex justify-end border-t border-[#DCE6F2] bg-white px-4 py-3 sm:px-5">
              <Button type="submit" disabled={saving}>
                <Save />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
